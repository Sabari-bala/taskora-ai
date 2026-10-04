"""Tests for Workspace and WorkspaceMember."""
import pytest
from django.db import IntegrityError

from apps.accounts.models import User
from apps.workspaces.models import Workspace, WorkspaceMember


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="arun@example.com",
        password="testpass123",
        full_name="Arun Kumar",
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email="priya@example.com",
        password="testpass123",
        full_name="Priya Sharma",
    )


@pytest.mark.django_db
class TestWorkspace:
    def test_create_workspace_generates_slug(self, user):
        ws = Workspace.objects.create(name="Taskora HQ", owner=user)
        assert ws.slug == "taskora-hq"
        assert ws.owner == user

    def test_slug_uniqueness_adds_suffix(self, user, other_user):
        ws1 = Workspace.objects.create(name="Team", owner=user)
        ws2 = Workspace.objects.create(name="Team", owner=other_user)
        assert ws1.slug == "team"
        assert ws2.slug == "team-2"

    def test_owner_cannot_be_deleted_while_workspace_exists(self, user):
        Workspace.objects.create(name="Protected", owner=user)
        with pytest.raises(Exception):
            user.delete()

    def test_str_returns_name(self, user):
        ws = Workspace.objects.create(name="Taskora HQ", owner=user)
        assert str(ws) == "Taskora HQ"


@pytest.mark.django_db
class TestWorkspaceMember:
    def test_add_member_defaults_to_member_role(self, user, other_user):
        ws = Workspace.objects.create(name="Taskora", owner=user)
        member = WorkspaceMember.objects.create(workspace=ws, user=other_user)
        assert member.role == WorkspaceMember.Role.MEMBER

    def test_membership_must_be_unique(self, user, other_user):
        ws = Workspace.objects.create(name="Taskora", owner=user)
        WorkspaceMember.objects.create(workspace=ws, user=other_user)
        with pytest.raises(IntegrityError):
            WorkspaceMember.objects.create(workspace=ws, user=other_user)

    def test_is_admin_or_above_true_for_owner(self, user):
        ws = Workspace.objects.create(name="Taskora", owner=user)
        member = WorkspaceMember.objects.create(
            workspace=ws, user=user, role=WorkspaceMember.Role.OWNER
        )
        assert member.is_admin_or_above is True

    def test_is_admin_or_above_false_for_member(self, user, other_user):
        ws = Workspace.objects.create(name="Taskora", owner=user)
        member = WorkspaceMember.objects.create(
            workspace=ws, user=other_user, role=WorkspaceMember.Role.MEMBER
        )
        assert member.is_admin_or_above is False

    def test_viewer_cannot_write(self, user, other_user):
        ws = Workspace.objects.create(name="Taskora", owner=user)
        member = WorkspaceMember.objects.create(
            workspace=ws, user=other_user, role=WorkspaceMember.Role.VIEWER
        )
        assert member.can_write is False

    def test_member_can_write(self, user, other_user):
        ws = Workspace.objects.create(name="Taskora", owner=user)
        member = WorkspaceMember.objects.create(
            workspace=ws, user=other_user, role=WorkspaceMember.Role.MEMBER
        )
        assert member.can_write is True

    def test_cascade_delete_when_workspace_removed(self, user, other_user):
        ws = Workspace.objects.create(name="Taskora", owner=user)
        WorkspaceMember.objects.create(workspace=ws, user=other_user)
        assert WorkspaceMember.objects.count() == 1
        ws.delete()
        assert WorkspaceMember.objects.count() == 0
