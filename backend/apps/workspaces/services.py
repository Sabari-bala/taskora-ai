
from django.db import transaction

from .models import Workspace, WorkspaceMember


@transaction.atomic
def create_workspace(*, owner, name, description=""):
    '''
    Create a workspace and register the creator as OWNER.
    Atomic so we never end up with an ownerless workspace.
    '''
    workspace = Workspace.objects.create(
        owner=owner,
        name=name,
        description=description,
    )
    WorkspaceMember.objects.create(
        workspace=workspace,
        user=owner,
        role=WorkspaceMember.Role.OWNER,
    )
    return workspace


@transaction.atomic
def add_member(*, workspace, user, role=WorkspaceMember.Role.MEMBER, invited_by=None):
    '''
    Add a user to a workspace. Raises if already a member.
    '''
    if WorkspaceMember.objects.filter(workspace=workspace, user=user).exists():
        raise ValueError("User is already a member of this workspace.")

    member = WorkspaceMember.objects.create(
        workspace=workspace,
        user=user,
        role=role,
    )

    if invited_by is not None:
        _notify_invite(workspace, user, invited_by)

    return member


def _notify_invite(workspace, invited_user, invited_by):
    '''Create a notification for the invited user.'''
    from apps.notifications.models import Notification

    Notification.objects.create(
        recipient=invited_user,
        actor=invited_by,
        verb=Notification.Verb.WORKSPACE_INVITE,
        target_type="workspace",
        target_id=workspace.id,
        message=f"You were added to {workspace.name}",
    )
