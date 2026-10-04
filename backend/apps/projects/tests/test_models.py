"""Tests for Label, Project, Milestone, and Task."""
from datetime import date, timedelta

import pytest
from django.db import IntegrityError

from apps.accounts.models import User
from apps.projects.models import Label, Milestone, Project, Task
from apps.workspaces.models import Workspace, WorkspaceMember


@pytest.fixture
def owner(db):
    return User.objects.create_user(email="owner@example.com", password="x")


@pytest.fixture
def member(db):
    return User.objects.create_user(email="member@example.com", password="x")


@pytest.fixture
def workspace(owner):
    ws = Workspace.objects.create(name="Test WS", owner=owner)
    WorkspaceMember.objects.create(
        workspace=ws, user=owner, role=WorkspaceMember.Role.OWNER
    )
    return ws


@pytest.fixture
def project(workspace, owner):
    return Project.objects.create(
        workspace=workspace, name="Website", key="web", lead=owner
    )


@pytest.mark.django_db
class TestLabel:
    def test_create_label(self, workspace):
        label = Label.objects.create(workspace=workspace, name="backend")
        assert label.name == "backend"
        assert label.color == "#4F5EE8"

    def test_label_name_unique_per_workspace(self, workspace):
        Label.objects.create(workspace=workspace, name="backend")
        with pytest.raises(IntegrityError):
            Label.objects.create(workspace=workspace, name="backend")

    def test_same_name_allowed_in_different_workspaces(self, owner, member):
        ws1 = Workspace.objects.create(name="WS 1", owner=owner)
        ws2 = Workspace.objects.create(name="WS 2", owner=member)
        Label.objects.create(workspace=ws1, name="backend")
        Label.objects.create(workspace=ws2, name="backend")
        assert Label.objects.count() == 2


@pytest.mark.django_db
class TestProject:
    def test_key_is_uppercased(self, workspace):
        p = Project.objects.create(workspace=workspace, name="Test", key="web")
        assert p.key == "WEB"

    def test_key_unique_within_workspace(self, workspace):
        Project.objects.create(workspace=workspace, name="A", key="WEB")
        with pytest.raises(IntegrityError):
            Project.objects.create(workspace=workspace, name="B", key="WEB")

    def test_default_status_active(self, workspace):
        p = Project.objects.create(workspace=workspace, name="X", key="X")
        assert p.status == Project.Status.ACTIVE

    def test_str_includes_key_and_name(self, project):
        assert str(project) == "WEB - Website"


@pytest.mark.django_db
class TestMilestone:
    def test_create_milestone(self, project):
        ms = Milestone.objects.create(
            project=project, title="Launch", due_date=date.today()
        )
        assert ms.is_completed is False
        assert str(ms) == "Launch"

    def test_cascade_delete_with_project(self, project):
        Milestone.objects.create(project=project, title="Launch")
        assert Milestone.objects.count() == 1
        project.delete()
        assert Milestone.objects.count() == 0


@pytest.mark.django_db
class TestTask:
    def test_create_task_with_defaults(self, project, owner):
        task = Task.objects.create(
            project=project, title="Build login", created_by=owner
        )
        assert task.status == Task.Status.BACKLOG
        assert task.priority == Task.Priority.MEDIUM
        assert task.position == 0
        assert task.completed_at is None

    def test_completed_at_set_when_status_done(self, project):
        task = Task.objects.create(project=project, title="Done task")
        task.status = Task.Status.DONE
        task.save()
        assert task.completed_at is not None

    def test_completed_at_cleared_when_reopened(self, project):
        task = Task.objects.create(
            project=project, title="T", status=Task.Status.DONE
        )
        task.status = Task.Status.IN_PROGRESS
        task.save()
        assert task.completed_at is None

    def test_is_overdue_when_due_date_passed(self, project):
        task = Task.objects.create(
            project=project,
            title="Late",
            due_date=date.today() - timedelta(days=1),
        )
        assert task.is_overdue is True

    def test_not_overdue_when_done(self, project):
        task = Task.objects.create(
            project=project,
            title="Done",
            due_date=date.today() - timedelta(days=5),
            status=Task.Status.DONE,
        )
        assert task.is_overdue is False

    def test_subtask_relationship(self, project):
        parent = Task.objects.create(project=project, title="Parent")
        child = Task.objects.create(
            project=project, title="Child", parent_task=parent
        )
        assert child.is_subtask is True
        assert parent.subtasks.count() == 1

    def test_labels_many_to_many(self, project, workspace):
        label = Label.objects.create(workspace=workspace, name="backend")
        task = Task.objects.create(project=project, title="T")
        task.labels.add(label)
        assert label in task.labels.all()
        assert task in label.tasks.all()

    def test_assignee_set_null_on_delete(self, project, owner, member):
        task = Task.objects.create(
            project=project, title="Assigned", assignee=member
        )
        member.delete()
        task.refresh_from_db()
        assert task.assignee is None
