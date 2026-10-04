"""Tests for AI Task Assistant endpoints."""
import json

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.ai.providers.base import AIProvider
from apps.projects.models import Project, Task
from apps.workspaces.services import create_workspace


pytestmark = pytest.mark.django_db


BREAKDOWN_RESPONSE = {
    "subtasks": [
        {"title": "Add registration endpoint", "priority": "high", "estimated_hours": 3},
        {"title": "Add login endpoint", "priority": "high", "estimated_hours": 2},
        {"title": "Write auth tests", "priority": "medium", "estimated_hours": 4},
    ]
}

SUMMARY_RESPONSE = {
    "summary": "Team decided to use JWT with refresh tokens. One blocker remains around CORS.",
    "decisions": ["Use JWT", "Store refresh in HttpOnly cookie"],
    "blockers": ["CORS config on staging"],
    "next_actions": ["Fix CORS", "Write integration tests"],
}

INSIGHTS_RESPONSE = {
    "headline": "Two tasks are overdue and one assignee is overloaded.",
    "observations": ["3 tasks in progress", "2 overdue tasks"],
    "risks": ["Overloaded assignee may miss the deadline"],
    "recommendations": ["Reassign one task to a teammate"],
}


class FakeProvider(AIProvider):
    def __init__(self, text):
        self.text = text
        self.model = "fake-model"

    def complete(self, *, system_prompt, user_prompt, json_mode=True, timeout=20):
        return {
            "text": self.text,
            "prompt_tokens": 40,
            "completion_tokens": 80,
            "model": self.model,
        }


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def owner():
    return User.objects.create_user(email="owner@example.com", password="x")


@pytest.fixture
def outsider():
    return User.objects.create_user(email="outsider@example.com", password="x")


@pytest.fixture
def auth(api, owner):
    access = str(RefreshToken.for_user(owner).access_token)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    return api


@pytest.fixture
def workspace(owner):
    return create_workspace(owner=owner, name="WS")


@pytest.fixture
def project(workspace):
    return Project.objects.create(workspace=workspace, name="P", key="P")


@pytest.fixture
def task(project, owner):
    return Task.objects.create(project=project, title="JWT auth", created_by=owner)


def _patch_provider(monkeypatch, text):
    from apps.ai import services as ai_services
    monkeypatch.setattr(ai_services, "get_provider", lambda: FakeProvider(text))


class TestBreakdownTask:

    def test_breakdown_returns_subtasks(self, auth, task, monkeypatch):
        _patch_provider(monkeypatch, json.dumps(BREAKDOWN_RESPONSE))
        response = auth.post(
            "/api/v1/ai/breakdown-task/",
            {"task_id": str(task.id)},
            format="json",
        )
        assert response.status_code == 200, response.json()
        data = response.json()["proposal"]
        assert len(data["subtasks"]) == 3

    def test_breakdown_writes_no_tasks(self, auth, task, monkeypatch):
        _patch_provider(monkeypatch, json.dumps(BREAKDOWN_RESPONSE))
        before = Task.objects.count()
        auth.post(
            "/api/v1/ai/breakdown-task/",
            {"task_id": str(task.id)},
            format="json",
        )
        assert Task.objects.count() == before

    def test_breakdown_rejects_non_member(self, api, task, outsider, monkeypatch):
        _patch_provider(monkeypatch, json.dumps(BREAKDOWN_RESPONSE))
        access = str(RefreshToken.for_user(outsider).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = api.post(
            "/api/v1/ai/breakdown-task/",
            {"task_id": str(task.id)},
            format="json",
        )
        assert response.status_code == 403


class TestSummarizeTask:

    def test_summarize_returns_structured_summary(self, auth, task, monkeypatch):
        _patch_provider(monkeypatch, json.dumps(SUMMARY_RESPONSE))
        response = auth.post(
            "/api/v1/ai/summarize-task/",
            {"task_id": str(task.id)},
            format="json",
        )
        assert response.status_code == 200
        data = response.json()["summary"]
        assert "summary" in data
        assert len(data["decisions"]) == 2
        assert len(data["blockers"]) == 1

    def test_summarize_invalid_json_returns_502(self, auth, task, monkeypatch):
        _patch_provider(monkeypatch, "not json")
        response = auth.post(
            "/api/v1/ai/summarize-task/",
            {"task_id": str(task.id)},
            format="json",
        )
        assert response.status_code == 502


class TestProjectInsights:

    def test_insights_requires_project_param(self, auth):
        response = auth.get("/api/v1/ai/project-insights/")
        assert response.status_code == 400

    def test_insights_returns_narrative(self, auth, project, monkeypatch):
        _patch_provider(monkeypatch, json.dumps(INSIGHTS_RESPONSE))
        response = auth.get(f"/api/v1/ai/project-insights/?project={project.id}")
        assert response.status_code == 200
        data = response.json()["insights"]
        assert "headline" in data
        assert len(data["observations"]) == 2
        assert len(data["recommendations"]) == 1

    def test_insights_real_stats_in_prompt(self, auth, project, owner, monkeypatch):
        """Confirm the prompt contains REAL numbers, not hallucinated ones."""
        captured = {}

        class CapturingProvider(FakeProvider):
            def complete(self, *, system_prompt, user_prompt, json_mode=True, timeout=20):
                captured["prompt"] = user_prompt
                return super().complete(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    json_mode=json_mode,
                    timeout=timeout,
                )

        from apps.ai import services as ai_services
        monkeypatch.setattr(
            ai_services, "get_provider",
            lambda: CapturingProvider(json.dumps(INSIGHTS_RESPONSE)),
        )

        Task.objects.create(project=project, title="A")
        Task.objects.create(project=project, title="B", status="done")
        Task.objects.create(project=project, title="C")

        auth.get(f"/api/v1/ai/project-insights/?project={project.id}")

        assert "Total tasks: 3" in captured["prompt"]
        assert "Total tasks: 999" not in captured["prompt"]

    def test_insights_rejects_non_member(self, api, project, outsider, monkeypatch):
        _patch_provider(monkeypatch, json.dumps(INSIGHTS_RESPONSE))
        access = str(RefreshToken.for_user(outsider).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = api.get(f"/api/v1/ai/project-insights/?project={project.id}")
        assert response.status_code == 403


class TestQuotaAcrossFeatures:

    def test_all_ai_calls_count_against_quota(self, auth, task, monkeypatch):
        from apps.ai.models import AIInteraction
        _patch_provider(monkeypatch, json.dumps(BREAKDOWN_RESPONSE))

        for _ in range(5):
            auth.post(
                "/api/v1/ai/breakdown-task/",
                {"task_id": str(task.id)},
                format="json",
            )
        assert AIInteraction.objects.filter(
            user=task.created_by,
            feature=AIInteraction.Feature.BREAKDOWN_TASK,
        ).count() == 5
