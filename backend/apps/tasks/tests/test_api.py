"""Tests for the tasks API."""
from datetime import date, timedelta

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.projects.models import Label, Project, Task
from apps.tasks.models import TaskActivity
from apps.workspaces.models import WorkspaceMember
from apps.workspaces.services import add_member, create_workspace


pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def owner():
    return User.objects.create_user(
        email="owner@example.com", password="x", full_name="Owner"
    )


@pytest.fixture
def member_user():
    return User.objects.create_user(
        email="member@example.com", password="x", full_name="Member"
    )


@pytest.fixture
def viewer():
    return User.objects.create_user(
        email="viewer@example.com", password="x", full_name="Viewer"
    )


@pytest.fixture
def outsider():
    return User.objects.create_user(
        email="outsider@example.com", password="x", full_name="Outsider"
    )


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


def _auth(api, user):
    access = str(RefreshToken.for_user(user).access_token)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    return api


class TestTaskCreate:

    def test_create_task_defaults_to_backlog(self, auth, project, owner):
        response = auth.post(
            "/api/v1/tasks/",
            {"project": str(project.id), "title": "Build login"},
            format="json",
        )
        assert response.status_code == 201, response.json()
        data = response.json()
        assert data["status"] == "backlog"
        assert data["priority"] == "medium"
        assert data["created_by"]["email"] == "owner@example.com"

    def test_create_task_logs_activity(self, auth, project):
        response = auth.post(
            "/api/v1/tasks/",
            {"project": str(project.id), "title": "X"},
            format="json",
        )
        task = Task.objects.get(id=response.json()["id"])
        assert TaskActivity.objects.filter(
            task=task, verb=TaskActivity.Verb.CREATED
        ).exists()

    def test_create_task_without_project_fails(self, auth):
        response = auth.post(
            "/api/v1/tasks/", {"title": "No project"}, format="json"
        )
        assert response.status_code == 400

    def test_viewer_cannot_create_task(self, api, project, owner, viewer):
        add_member(
            workspace=project.workspace, user=viewer,
            role=WorkspaceMember.Role.VIEWER,
        )
        _auth(api, viewer)
        response = api.post(
            "/api/v1/tasks/",
            {"project": str(project.id), "title": "X"},
            format="json",
        )
        assert response.status_code == 403

    def test_outsider_cannot_create_task(self, api, project, outsider):
        _auth(api, outsider)
        response = api.post(
            "/api/v1/tasks/",
            {"project": str(project.id), "title": "X"},
            format="json",
        )
        assert response.status_code == 403

    def test_assignee_must_be_workspace_member(self, auth, project, outsider):
        response = auth.post(
            "/api/v1/tasks/",
            {
                "project": str(project.id),
                "title": "X",
                "assignee": str(outsider.id),
            },
            format="json",
        )
        assert response.status_code == 400


class TestTaskList:

    def test_filter_by_project(self, auth, workspace):
        p1 = Project.objects.create(workspace=workspace, name="P1", key="P1")
        p2 = Project.objects.create(workspace=workspace, name="P2", key="P2")
        Task.objects.create(project=p1, title="In P1")
        Task.objects.create(project=p2, title="In P2")
        response = auth.get(f"/api/v1/tasks/?project={p1.id}")
        titles = [t["title"] for t in response.json()["results"]]
        assert "In P1" in titles
        assert "In P2" not in titles

    def test_filter_by_status(self, auth, project):
        Task.objects.create(project=project, title="A", status="todo")
        Task.objects.create(project=project, title="B", status="done")
        response = auth.get(f"/api/v1/tasks/?project={project.id}&status=todo")
        titles = [t["title"] for t in response.json()["results"]]
        assert titles == ["A"]

    def test_filter_mine(self, auth, project, owner):
        Task.objects.create(project=project, title="Mine", assignee=owner)
        Task.objects.create(project=project, title="Not mine")
        response = auth.get("/api/v1/tasks/?mine=true")
        titles = [t["title"] for t in response.json()["results"]]
        assert titles == ["Mine"]

    def test_search_by_title(self, auth, project):
        Task.objects.create(project=project, title="Deploy the website")
        Task.objects.create(project=project, title="Write tests")
        response = auth.get("/api/v1/tasks/?search=website")
        titles = [t["title"] for t in response.json()["results"]]
        assert titles == ["Deploy the website"]


class TestTaskUpdate:

    def test_change_status_logs_activity(self, auth, project, owner):
        t = Task.objects.create(project=project, title="X", created_by=owner)
        response = auth.patch(
            f"/api/v1/tasks/{t.id}/", {"status": "in_progress"}, format="json"
        )
        assert response.status_code == 200
        assert TaskActivity.objects.filter(
            task=t, verb=TaskActivity.Verb.STATUS_CHANGED,
            from_value="backlog", to_value="in_progress",
        ).exists()

    def test_assign_logs_activity(self, auth, project, owner, member_user):
        add_member(workspace=project.workspace, user=member_user)
        t = Task.objects.create(project=project, title="X", created_by=owner)
        auth.patch(
            f"/api/v1/tasks/{t.id}/",
            {"assignee": str(member_user.id)},
            format="json",
        )
        assert TaskActivity.objects.filter(
            task=t, verb=TaskActivity.Verb.ASSIGNED
        ).exists()

    def test_viewer_cannot_update(self, api, project, owner, viewer):
        add_member(
            workspace=project.workspace, user=viewer,
            role=WorkspaceMember.Role.VIEWER,
        )
        t = Task.objects.create(project=project, title="X", created_by=owner)
        _auth(api, viewer)
        response = api.patch(
            f"/api/v1/tasks/{t.id}/", {"title": "Hacked"}, format="json"
        )
        assert response.status_code == 403


class TestTaskReorder:

    def test_reorder_within_same_status(self, auth, project, owner):
        t = Task.objects.create(
            project=project, title="X", status="todo", position=5
        )
        response = auth.post(
            f"/api/v1/tasks/{t.id}/reorder/",
            {"status": "todo", "position": 1},
            format="json",
        )
        assert response.status_code == 200
        t.refresh_from_db()
        assert t.position == 1

    def test_reorder_across_status_logs_activity(self, auth, project, owner):
        t = Task.objects.create(
            project=project, title="X", status="todo", position=0
        )
        auth.post(
            f"/api/v1/tasks/{t.id}/reorder/",
            {"status": "done", "position": 0},
            format="json",
        )
        assert TaskActivity.objects.filter(
            task=t, verb=TaskActivity.Verb.STATUS_CHANGED,
            from_value="todo", to_value="done",
        ).exists()

    def test_reorder_notifies_assignee(self, auth, project, owner, member_user):
        add_member(workspace=project.workspace, user=member_user)
        t = Task.objects.create(
            project=project, title="X", assignee=member_user,
            status="todo", created_by=owner,
        )
        auth.post(
            f"/api/v1/tasks/{t.id}/reorder/",
            {"status": "done", "position": 0},
            format="json",
        )
        from apps.notifications.models import Notification
        assert Notification.objects.filter(
            recipient=member_user,
            verb=Notification.Verb.TASK_STATUS_CHANGED,
        ).exists()


class TestTaskActivityEndpoint:

    def test_activity_endpoint_returns_log(self, auth, project, owner):
        t = Task.objects.create(project=project, title="X", created_by=owner)
        TaskActivity.objects.create(
            task=t, actor=owner, verb=TaskActivity.Verb.CREATED
        )
        response = auth.get(f"/api/v1/tasks/{t.id}/activity/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "created the task" in data[0]["human_readable"]


class TestProjectBoard:

    def test_board_groups_tasks_by_status(self, auth, workspace):
        p = Project.objects.create(workspace=workspace, name="P", key="P")
        Task.objects.create(project=p, title="A", status="todo")
        Task.objects.create(project=p, title="B", status="todo")
        Task.objects.create(project=p, title="C", status="done")
        response = auth.get(f"/api/v1/projects/{p.id}/board/")
        assert response.status_code == 200
        data = response.json()
        assert len(data["todo"]) == 2
        assert len(data["done"]) == 1
        assert len(data["backlog"]) == 0
