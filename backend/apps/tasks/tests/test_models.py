"""Tests for TaskComment and TaskActivity."""
import pytest

from apps.accounts.models import User
from apps.projects.models import Project, Task
from apps.tasks.models import TaskActivity, TaskComment
from apps.workspaces.models import Workspace, WorkspaceMember


@pytest.fixture
def owner(db):
    return User.objects.create_user(
        email="owner@example.com", password="x", full_name="Owner"
    )


@pytest.fixture
def member(db):
    return User.objects.create_user(
        email="member@example.com", password="x", full_name="Member"
    )


@pytest.fixture
def workspace(owner):
    ws = Workspace.objects.create(name="WS", owner=owner)
    WorkspaceMember.objects.create(
        workspace=ws, user=owner, role=WorkspaceMember.Role.OWNER
    )
    return ws


@pytest.fixture
def project(workspace):
    return Project.objects.create(workspace=workspace, name="P", key="P")


@pytest.fixture
def task(project, owner):
    return Task.objects.create(project=project, title="T", created_by=owner)


@pytest.mark.django_db
class TestTaskComment:
    def test_create_comment(self, task, member):
        comment = TaskComment.objects.create(
            task=task, author=member, body="Looks good."
        )
        assert comment.body == "Looks good."
        assert comment.edited_at is None
        assert task.comments.count() == 1

    def test_cascade_delete_with_task(self, task, member):
        TaskComment.objects.create(task=task, author=member, body="x")
        assert TaskComment.objects.count() == 1
        task.delete()
        assert TaskComment.objects.count() == 0

    def test_author_null_on_user_delete(self, task, member):
        comment = TaskComment.objects.create(task=task, author=member, body="x")
        member.delete()
        comment.refresh_from_db()
        assert comment.author is None


@pytest.mark.django_db
class TestTaskActivity:
    def test_create_activity_row(self, task, owner):
        activity = TaskActivity.objects.create(
            task=task,
            actor=owner,
            verb=TaskActivity.Verb.CREATED,
        )
        assert activity.verb == TaskActivity.Verb.CREATED
        assert task.activities.count() == 1

    def test_human_readable_created(self, task, owner):
        activity = TaskActivity.objects.create(
            task=task, actor=owner, verb=TaskActivity.Verb.CREATED
        )
        assert activity.human_readable == "Owner created the task"

    def test_human_readable_status_change(self, task, owner):
        activity = TaskActivity.objects.create(
            task=task,
            actor=owner,
            verb=TaskActivity.Verb.STATUS_CHANGED,
            from_value="todo",
            to_value="in_progress",
        )
        assert "moved status from todo to in_progress" in activity.human_readable

    def test_human_readable_label_added(self, task, owner):
        activity = TaskActivity.objects.create(
            task=task,
            actor=owner,
            verb=TaskActivity.Verb.LABEL_ADDED,
            to_value="backend",
        )
        assert "added label backend" in activity.human_readable

    def test_activities_ordered_newest_first(self, task, owner):
        a1 = TaskActivity.objects.create(
            task=task, actor=owner, verb=TaskActivity.Verb.CREATED
        )
        a2 = TaskActivity.objects.create(
            task=task, actor=owner, verb=TaskActivity.Verb.STATUS_CHANGED,
            from_value="todo", to_value="done",
        )
        result = list(task.activities.all())
        assert result[0] == a2
        assert result[1] == a1

    def test_cascade_delete_with_task(self, task, owner):
        TaskActivity.objects.create(
            task=task, actor=owner, verb=TaskActivity.Verb.CREATED
        )
        task.delete()
        assert TaskActivity.objects.count() == 0
