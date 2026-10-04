"""Tests for task comments."""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.projects.models import Project, Task
from apps.tasks.models import TaskActivity, TaskComment
from apps.workspaces.models import WorkspaceMember
from apps.workspaces.services import add_member, create_workspace


pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def owner():
    return User.objects.create_user(email="owner@example.com", password="x")


@pytest.fixture
def member_user():
    return User.objects.create_user(email="member@example.com", password="x")


@pytest.fixture
def viewer():
    return User.objects.create_user(email="viewer@example.com", password="x")


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
    return Task.objects.create(project=project, title="T", created_by=owner)


class TestCommentCreate:

    def test_create_comment(self, auth, task):
        response = auth.post(
            f"/api/v1/tasks/{task.id}/comments/",
            {"body": "Looks good."},
            format="json",
        )
        assert response.status_code == 201, response.json()
        assert response.json()["body"] == "Looks good."
        assert TaskComment.objects.filter(task=task).count() == 1

    def test_comment_logs_activity(self, auth, task):
        auth.post(
            f"/api/v1/tasks/{task.id}/comments/",
            {"body": "x"},
            format="json",
        )
        assert TaskActivity.objects.filter(
            task=task, verb=TaskActivity.Verb.COMMENTED
        ).exists()

    def test_comment_notifies_assignee(self, auth, project, owner, member_user):
        add_member(workspace=project.workspace, user=member_user)
        task = Task.objects.create(
            project=project, title="T", assignee=member_user, created_by=owner
        )
        auth.post(
            f"/api/v1/tasks/{task.id}/comments/",
            {"body": "ping"},
            format="json",
        )
        assert Notification.objects.filter(
            recipient=member_user,
            verb=Notification.Verb.TASK_COMMENTED,
        ).exists()

    def test_no_self_notification(self, auth, project, owner):
        task = Task.objects.create(
            project=project, title="T", assignee=owner, created_by=owner
        )
        auth.post(
            f"/api/v1/tasks/{task.id}/comments/",
            {"body": "self"},
            format="json",
        )
        assert not Notification.objects.filter(
            recipient=owner,
            verb=Notification.Verb.TASK_COMMENTED,
        ).exists()

    def test_viewer_cannot_comment(self, api, project, owner, viewer, task):
        add_member(
            workspace=project.workspace, user=viewer,
            role=WorkspaceMember.Role.VIEWER,
        )
        access = str(RefreshToken.for_user(viewer).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = api.post(
            f"/api/v1/tasks/{task.id}/comments/",
            {"body": "x"},
            format="json",
        )
        assert response.status_code == 403


class TestCommentList:

    def test_list_comments_oldest_first(self, auth, task, owner):
        TaskComment.objects.create(task=task, author=owner, body="first")
        TaskComment.objects.create(task=task, author=owner, body="second")
        response = auth.get(f"/api/v1/tasks/{task.id}/comments/")
        assert response.status_code == 200
        results = response.json()["results"]
        assert results[0]["body"] == "first"
        assert results[1]["body"] == "second"


class TestCommentEditDelete:

    def test_author_can_edit(self, auth, task, owner):
        c = TaskComment.objects.create(task=task, author=owner, body="old")
        response = auth.patch(
            f"/api/v1/tasks/{task.id}/comments/{c.id}/",
            {"body": "new"},
            format="json",
        )
        assert response.status_code == 200
        c.refresh_from_db()
        assert c.body == "new"

    def test_non_author_cannot_edit(self, api, task, owner, member_user):
        from apps.workspaces.services import add_member
        add_member(workspace=task.project.workspace, user=member_user)
        c = TaskComment.objects.create(task=task, author=owner, body="x")
        access = str(RefreshToken.for_user(member_user).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = api.patch(
            f"/api/v1/tasks/{task.id}/comments/{c.id}/",
            {"body": "hacked"},
            format="json",
        )
        assert response.status_code == 403

    def test_author_can_delete(self, auth, task, owner):
        c = TaskComment.objects.create(task=task, author=owner, body="x")
        response = auth.delete(f"/api/v1/tasks/{task.id}/comments/{c.id}/")
        assert response.status_code == 204
        assert not TaskComment.objects.filter(id=c.id).exists()

    def test_non_author_cannot_delete(self, api, task, owner, member_user):
        from apps.workspaces.services import add_member
        add_member(workspace=task.project.workspace, user=member_user)
        c = TaskComment.objects.create(task=task, author=owner, body="x")
        access = str(RefreshToken.for_user(member_user).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = api.delete(f"/api/v1/tasks/{task.id}/comments/{c.id}/")
        assert response.status_code == 403
