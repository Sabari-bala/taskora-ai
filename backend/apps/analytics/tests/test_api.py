"""Tests for the dashboard/analytics API."""
from datetime import date, timedelta

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.projects.models import Project, Task
from apps.tasks.models import TaskActivity
from apps.workspaces.services import create_workspace


pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def user():
    return User.objects.create_user(email="user@example.com", password="x")


@pytest.fixture
def other_user():
    return User.objects.create_user(email="other@example.com", password="x")


@pytest.fixture
def auth(api, user):
    access = str(RefreshToken.for_user(user).access_token)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    return api


@pytest.fixture
def workspace(user):
    return create_workspace(owner=user, name="WS")


@pytest.fixture
def project(workspace):
    return Project.objects.create(workspace=workspace, name="P", key="P")


class TestDashboardSummary:

    def test_summary_requires_auth(self, api):
        response = api.get("/api/v1/dashboard/summary/")
        assert response.status_code == 401

    def test_summary_zero_when_no_data(self, auth):
        response = auth.get("/api/v1/dashboard/summary/")
        assert response.status_code == 200
        data = response.json()
        assert data["workspace_count"] == 0
        assert data["total_tasks"] == 0
        assert data["overdue_tasks"] == 0

    def test_summary_counts_projects_and_tasks(self, auth, project, user):
        Task.objects.create(project=project, title="A")
        Task.objects.create(project=project, title="B", status="done")
        Task.objects.create(project=project, title="C")

        response = auth.get("/api/v1/dashboard/summary/")
        data = response.json()
        assert data["workspace_count"] == 1
        assert data["active_projects"] == 1
        assert data["total_tasks"] == 3
        assert data["completed_tasks"] == 1

    def test_summary_counts_overdue(self, auth, project, user):
        Task.objects.create(
            project=project, title="Late",
            due_date=date.today() - timedelta(days=2),
        )
        Task.objects.create(
            project=project, title="On time",
            due_date=date.today() + timedelta(days=2),
        )
        Task.objects.create(
            project=project, title="Done late",
            due_date=date.today() - timedelta(days=5),
            status="done",
        )

        response = auth.get("/api/v1/dashboard/summary/")
        assert response.json()["overdue_tasks"] == 1

    def test_summary_counts_mine(self, auth, project, user, other_user):
        Task.objects.create(project=project, title="Mine", assignee=user)
        Task.objects.create(project=project, title="Not mine", assignee=other_user)
        Task.objects.create(project=project, title="Done mine", assignee=user, status="done")

        response = auth.get("/api/v1/dashboard/summary/")
        assert response.json()["assigned_to_me"] == 1


class TestDashboardActivity:

    def test_activity_only_shows_user_workspaces(self, auth, project, user, other_user):
        task = Task.objects.create(project=project, title="T", created_by=user)
        TaskActivity.objects.create(task=task, actor=user, verb=TaskActivity.Verb.CREATED)

        other_ws = create_workspace(owner=other_user, name="Other")
        other_proj = Project.objects.create(workspace=other_ws, name="OP", key="OP")
        other_task = Task.objects.create(project=other_proj, title="OT", created_by=other_user)
        TaskActivity.objects.create(
            task=other_task, actor=other_user, verb=TaskActivity.Verb.CREATED
        )

        response = auth.get("/api/v1/dashboard/activity/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["verb"] == "created"

    def test_activity_empty_when_no_data(self, auth):
        response = auth.get("/api/v1/dashboard/activity/")
        assert response.status_code == 200
        assert response.json() == []


class TestDashboardMyTasks:

    def test_my_tasks_only_returns_assigned(self, auth, project, user, other_user):
        Task.objects.create(project=project, title="Mine", assignee=user)
        Task.objects.create(project=project, title="Not mine", assignee=other_user)

        response = auth.get("/api/v1/dashboard/my-tasks/")
        assert response.status_code == 200
        titles = [t["title"] for t in response.json()]
        assert titles == ["Mine"]

    def test_my_tasks_excludes_done(self, auth, project, user):
        Task.objects.create(project=project, title="Open", assignee=user)
        Task.objects.create(
            project=project, title="Done", assignee=user, status="done"
        )

        response = auth.get("/api/v1/dashboard/my-tasks/")
        titles = [t["title"] for t in response.json()]
        assert titles == ["Open"]
