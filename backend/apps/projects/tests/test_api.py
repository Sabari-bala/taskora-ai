"""Tests for the projects API."""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.projects.models import Label, Milestone, Project
from apps.workspaces.models import WorkspaceMember
from apps.workspaces.services import create_workspace


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


class TestProjectCreate:

    def test_create_project_in_own_workspace(self, auth, workspace):
        response = auth.post(
            "/api/v1/projects/",
            {
                "workspace": str(workspace.id),
                "name": "Website",
                "key": "web",
            },
            format="json",
        )
        assert response.status_code == 201, response.json()
        data = response.json()
        assert data["key"] == "WEB"
        assert data["name"] == "Website"

    def test_create_project_rejects_duplicate_key(self, auth, workspace):
        Project.objects.create(workspace=workspace, name="A", key="WEB")
        response = auth.post(
            "/api/v1/projects/",
            {"workspace": str(workspace.id), "name": "B", "key": "WEB"},
            format="json",
        )
        assert response.status_code == 400

    def test_create_project_rejects_non_alnum_key(self, auth, workspace):
        response = auth.post(
            "/api/v1/projects/",
            {"workspace": str(workspace.id), "name": "X", "key": "W-E-B"},
            format="json",
        )
        assert response.status_code == 400

    def test_create_project_in_foreign_workspace_fails(
        self, api, workspace, outsider
    ):
        access = str(RefreshToken.for_user(outsider).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = api.post(
            "/api/v1/projects/",
            {"workspace": str(workspace.id), "name": "Hack", "key": "X"},
            format="json",
        )
        assert response.status_code == 403


class TestProjectList:

    def test_list_only_own_projects(self, auth, workspace, outsider):
        Project.objects.create(workspace=workspace, name="Mine", key="MINE")
        other_ws = create_workspace(owner=outsider, name="Other")
        Project.objects.create(workspace=other_ws, name="Theirs", key="THEIR")
        response = auth.get("/api/v1/projects/")
        assert response.status_code == 200
        names = [p["name"] for p in response.json()["results"]]
        assert "Mine" in names
        assert "Theirs" not in names

    def test_filter_by_workspace(self, auth, owner, workspace):
        other_ws = create_workspace(owner=owner, name="Second")
        Project.objects.create(workspace=workspace, name="P1", key="P1")
        Project.objects.create(workspace=other_ws, name="P2", key="P2")
        response = auth.get(f"/api/v1/projects/?workspace={workspace.id}")
        names = [p["name"] for p in response.json()["results"]]
        assert names == ["P1"]

    def test_search_by_name(self, auth, workspace):
        Project.objects.create(workspace=workspace, name="Website", key="WEB")
        Project.objects.create(workspace=workspace, name="Mobile", key="MOB")
        response = auth.get("/api/v1/projects/?search=web")
        names = [p["name"] for p in response.json()["results"]]
        assert names == ["Website"]


class TestProjectUpdateDelete:

    def test_update_own_project(self, auth, workspace):
        p = Project.objects.create(workspace=workspace, name="Old", key="OLD")
        response = auth.patch(
            f"/api/v1/projects/{p.id}/", {"name": "New"}, format="json"
        )
        assert response.status_code == 200
        p.refresh_from_db()
        assert p.name == "New"

    def test_delete_own_project(self, auth, workspace):
        p = Project.objects.create(workspace=workspace, name="X", key="X")
        response = auth.delete(f"/api/v1/projects/{p.id}/")
        assert response.status_code == 204
        assert not Project.objects.filter(id=p.id).exists()


class TestProjectBoardAndAnalytics:

    def test_board_returns_grouped_tasks(self, auth, workspace):
        p = Project.objects.create(workspace=workspace, name="X", key="X")
        response = auth.get(f"/api/v1/projects/{p.id}/board/")
        assert response.status_code == 200
        data = response.json()
        assert "backlog" in data
        assert "todo" in data

    def test_analytics_returns_real_numbers(self, auth, workspace):
        p = Project.objects.create(workspace=workspace, name="X", key="X")
        response = auth.get(f"/api/v1/projects/{p.id}/analytics/")
        assert response.status_code == 200
        data = response.json()
        assert data["total_tasks"] == 0
        assert "status_counts" in data


class TestMilestones:

    def test_create_milestone_in_own_project(self, auth, workspace):
        p = Project.objects.create(workspace=workspace, name="X", key="X")
        response = auth.post(
            f"/api/v1/projects/{p.id}/milestones/",
            {"title": "Launch", "due_date": "2026-12-01"},
            format="json",
        )
        assert response.status_code == 201, response.json()
        assert Milestone.objects.filter(project=p).count() == 1

    def test_list_milestones_in_project(self, auth, workspace):
        p = Project.objects.create(workspace=workspace, name="X", key="X")
        Milestone.objects.create(project=p, title="M1")
        Milestone.objects.create(project=p, title="M2")
        response = auth.get(f"/api/v1/projects/{p.id}/milestones/")
        assert response.status_code == 200
        # Response is paginated — check the results list
        body = response.json()
        assert body["count"] == 2
        assert len(body["results"]) == 2


class TestLabels:

    def test_create_label_in_workspace(self, auth, workspace):
        response = auth.post(
            "/api/v1/labels/",
            {"workspace": str(workspace.id), "name": "backend"},
            format="json",
        )
        assert response.status_code == 201, response.json()
        assert Label.objects.filter(workspace=workspace).exists()

    def test_list_labels_scoped_to_workspace(self, auth, workspace, outsider):
        Label.objects.create(workspace=workspace, name="mine")
        other_ws = create_workspace(owner=outsider, name="Other")
        Label.objects.create(workspace=other_ws, name="theirs")
        response = auth.get(f"/api/v1/labels/?workspace={workspace.id}")
        names = [label["name"] for label in response.json()["results"]]
        assert "mine" in names
        assert "theirs" not in names
