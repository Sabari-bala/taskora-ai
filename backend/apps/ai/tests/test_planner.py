"""Tests for the AI Project Planner endpoints."""
import json

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.ai.models import AIInteraction
from apps.ai.providers.base import AIProvider
from apps.projects.models import Label, Milestone, Project, Task
from apps.workspaces.models import WorkspaceMember
from apps.workspaces.services import add_member, create_workspace


pytestmark = pytest.mark.django_db


VALID_PROPOSAL = {
    "overview": "A food delivery platform connecting local restaurants to customers.",
    "milestones": [
        {"title": "Foundation", "description": "Auth and core models", "suggested_week": 1},
        {"title": "Ordering", "description": "Cart and checkout", "suggested_week": 3},
    ],
    "epics": [
        {"name": "Auth", "description": "User management"},
        {"name": "Catalog", "description": "Restaurant listings"},
    ],
    "tasks": [
        {"title": "Set up Django project", "epic": "Auth", "priority": "high"},
        {"title": "User model", "epic": "Auth", "priority": "high", "milestone_title": "Foundation"},
        {"title": "Restaurant model", "epic": "Catalog", "priority": "medium", "milestone_title": "Foundation"},
    ],
}


class FakeProvider(AIProvider):
    def __init__(self, response_text):
        self.response_text = response_text
        self.model = "fake-model"

    def complete(self, *, system_prompt, user_prompt, json_mode=True, timeout=20):
        return {
            "text": self.response_text,
            "prompt_tokens": 50,
            "completion_tokens": 150,
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


def _patch_provider(monkeypatch, response_text):
    from apps.ai import services as ai_services

    monkeypatch.setattr(
        ai_services,
        "get_provider",
        lambda: FakeProvider(response_text),
    )


class TestPlanProjectGenerate:

    def test_generate_returns_proposal(self, auth, workspace, monkeypatch):
        _patch_provider(monkeypatch, json.dumps(VALID_PROPOSAL))

        response = auth.post(
            "/api/v1/ai/plan-project/",
            {
                "workspace_id": str(workspace.id),
                "idea": "Build an online food delivery platform for local restaurants.",
            },
            format="json",
        )
        assert response.status_code == 200, response.json()
        data = response.json()["proposal"]
        assert data["overview"] == VALID_PROPOSAL["overview"]
        assert len(data["tasks"]) == 3

    def test_generate_writes_no_projects(self, auth, workspace, monkeypatch):
        _patch_provider(monkeypatch, json.dumps(VALID_PROPOSAL))
        before = Project.objects.count()

        auth.post(
            "/api/v1/ai/plan-project/",
            {
                "workspace_id": str(workspace.id),
                "idea": "Build an online food delivery platform for local restaurants.",
            },
            format="json",
        )
        assert Project.objects.count() == before

    def test_generate_requires_membership(self, api, workspace, outsider, monkeypatch):
        _patch_provider(monkeypatch, json.dumps(VALID_PROPOSAL))
        access = str(RefreshToken.for_user(outsider).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = api.post(
            "/api/v1/ai/plan-project/",
            {
                "workspace_id": str(workspace.id),
                "idea": "Build an online food delivery platform for local restaurants.",
            },
            format="json",
        )
        assert response.status_code == 403

    def test_generate_rejects_short_idea(self, auth, workspace):
        response = auth.post(
            "/api/v1/ai/plan-project/",
            {"workspace_id": str(workspace.id), "idea": "short"},
            format="json",
        )
        assert response.status_code == 400

    def test_generate_invalid_json_returns_502(self, auth, workspace, monkeypatch):
        _patch_provider(monkeypatch, "not valid json at all")
        response = auth.post(
            "/api/v1/ai/plan-project/",
            {
                "workspace_id": str(workspace.id),
                "idea": "Build an online food delivery platform for local restaurants.",
            },
            format="json",
        )
        assert response.status_code == 502


class TestPlanProjectCommit:

    def _commit_payload(self, workspace):
        return {
            "workspace_id": str(workspace.id),
            "project_name": "Food Delivery",
            "project_key": "food",
            "project_description": "A platform for local restaurants.",
            "milestones": [
                {"title": "Foundation", "description": "Auth and core models"},
            ],
            "tasks": [
                {"title": "Set up Django project", "epic": "Auth", "priority": "high"},
                {"title": "User model", "epic": "Auth", "priority": "high", "milestone_title": "Foundation"},
                {"title": "Restaurant model", "epic": "Catalog", "priority": "medium"},
            ],
        }

    def test_commit_creates_project_milestones_tasks(self, auth, workspace):
        response = auth.post(
            "/api/v1/ai/plan-project/commit/",
            self._commit_payload(workspace),
            format="json",
        )
        assert response.status_code == 201, response.json()
        data = response.json()
        assert data["tasks_created"] == 3
        assert data["milestones_created"] == 1
        assert data["labels_created"] == 2

        project = Project.objects.get(id=data["project_id"])
        assert project.key == "FOOD"
        assert project.workspace == workspace
        assert project.tasks.count() == 3
        assert Milestone.objects.filter(project=project).count() == 1
        assert Label.objects.filter(workspace=workspace).count() == 2

    def test_commit_attaches_milestone_to_task(self, auth, workspace):
        auth.post(
            "/api/v1/ai/plan-project/commit/",
            self._commit_payload(workspace),
            format="json",
        )
        task = Task.objects.get(title="User model")
        assert task.milestone is not None
        assert task.milestone.title == "Foundation"

    def test_commit_creates_activity_rows(self, auth, workspace):
        auth.post(
            "/api/v1/ai/plan-project/commit/",
            self._commit_payload(workspace),
            format="json",
        )
        from apps.tasks.models import TaskActivity

        assert TaskActivity.objects.filter(
            verb=TaskActivity.Verb.CREATED
        ).count() == 3

    def test_commit_rejects_duplicate_project_key(self, auth, workspace):
        payload = self._commit_payload(workspace)
        auth.post("/api/v1/ai/plan-project/commit/", payload, format="json")
        response = auth.post("/api/v1/ai/plan-project/commit/", payload, format="json")
        assert response.status_code == 400

    def test_commit_requires_membership(self, api, workspace, outsider):
        access = str(RefreshToken.for_user(outsider).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = api.post(
            "/api/v1/ai/plan-project/commit/",
            self._commit_payload(workspace),
            format="json",
        )
        assert response.status_code == 403

    def test_commit_viewer_forbidden(self, api, workspace, owner):
        viewer = User.objects.create_user(email="viewer@example.com", password="x")
        add_member(
            workspace=workspace, user=viewer,
            role=WorkspaceMember.Role.VIEWER,
        )
        access = str(RefreshToken.for_user(viewer).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = api.post(
            "/api/v1/ai/plan-project/commit/",
            self._commit_payload(workspace),
            format="json",
        )
        assert response.status_code == 403
