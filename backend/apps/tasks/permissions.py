from rest_framework.permissions import BasePermission

from apps.workspaces.models import WorkspaceMember


def _task_workspace(task):
    return task.project.workspace


def _role(user, workspace):
    m = WorkspaceMember.objects.filter(workspace=workspace, user=user).first()
    return m.role if m else None


class IsTaskWorkspaceMember(BasePermission):
    message = 'You are not a member of this workspace.'

    def has_object_permission(self, request, view, obj):
        return _role(request.user, _task_workspace(obj)) is not None


class CanEditTask(BasePermission):
    message = 'Viewers cannot edit tasks.'

    def has_object_permission(self, request, view, obj):
        role = _role(request.user, _task_workspace(obj))
        return role is not None and role != WorkspaceMember.Role.VIEWER
