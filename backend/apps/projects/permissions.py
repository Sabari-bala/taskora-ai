from rest_framework.permissions import BasePermission

from apps.workspaces.models import WorkspaceMember


def _get_workspace(obj):
    if hasattr(obj, 'workspace_id') and hasattr(obj, 'workspace'):
        return obj.workspace
    if hasattr(obj, 'project'):
        return obj.project.workspace
    return None


def _role_in_workspace(user, workspace):
    if workspace is None:
        return None
    member = WorkspaceMember.objects.filter(
        workspace=workspace, user=user
    ).first()
    return member.role if member else None


class IsProjectMember(BasePermission):
    message = 'You are not a member of this project workspace.'

    def has_object_permission(self, request, view, obj):
        workspace = _get_workspace(obj)
        return _role_in_workspace(request.user, workspace) is not None


class CanManageProject(BasePermission):
    message = 'You need manager permissions in this workspace.'

    ADMIN_ROLES = {
        WorkspaceMember.Role.OWNER,
        WorkspaceMember.Role.ADMIN,
        WorkspaceMember.Role.MANAGER,
    }

    def has_object_permission(self, request, view, obj):
        workspace = _get_workspace(obj)
        role = _role_in_workspace(request.user, workspace)
        return role in self.ADMIN_ROLES
