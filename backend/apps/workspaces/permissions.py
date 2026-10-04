
from rest_framework.permissions import BasePermission

from .models import Workspace, WorkspaceMember


def _resolve_workspace(obj):
    '''Get the workspace from an object that may be one itself.'''
    if isinstance(obj, Workspace):
        return obj
    return getattr(obj, "workspace", None)


class IsWorkspaceMember(BasePermission):
    '''User must belong to the workspace in question.'''

    message = "You are not a member of this workspace."

    def has_object_permission(self, request, view, obj):
        workspace = _resolve_workspace(obj)
        if workspace is None:
            return False
        return WorkspaceMember.objects.filter(
            workspace=workspace, user=request.user
        ).exists()


class IsWorkspaceAdmin(BasePermission):
    '''User must be OWNER or ADMIN of the workspace.'''

    message = "Only workspace owners and admins can do this."

    def has_object_permission(self, request, view, obj):
        workspace = _resolve_workspace(obj)
        if workspace is None:
            return False
        return WorkspaceMember.objects.filter(
            workspace=workspace,
            user=request.user,
            role__in=[
                WorkspaceMember.Role.OWNER,
                WorkspaceMember.Role.ADMIN,
            ],
        ).exists()
