from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.projects.models import Task
from apps.workspaces.models import WorkspaceMember

from .comment_serializers import TaskCommentSerializer
from .comment_services import create_comment
from .models import TaskComment


def _role(user, workspace):
    m = WorkspaceMember.objects.filter(workspace=workspace, user=user).first()
    return m.role if m else None


@extend_schema(tags=['tasks'])
class TaskCommentViewSet(viewsets.ModelViewSet):
    '''Comments for a task. Nested under /tasks/<id>/comments/.'''

    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def _get_task(self):
        return get_object_or_404(Task, id=self.kwargs['task_id'])

    def _check_membership(self, task):
        role = _role(self.request.user, task.project.workspace)
        if role is None:
            raise PermissionDenied('You are not a member of this workspace.')
        return role

    def get_queryset(self):
        return (
            TaskComment.objects
            .filter(
                task_id=self.kwargs['task_id'],
                task__project__workspace__memberships__user=self.request.user,
            )
            .select_related('author')
            .distinct()
        )

    def create(self, request, *args, **kwargs):
        task = self._get_task()
        role = self._check_membership(task)

        if role == WorkspaceMember.Role.VIEWER:
            raise PermissionDenied('Viewers cannot comment.')

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = create_comment(
            task=task,
            author=request.user,
            body=serializer.validated_data['body'],
        )
        return Response(
            TaskCommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            raise PermissionDenied('You can only edit your own comments.')
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            raise PermissionDenied('You can only delete your own comments.')
        return super().destroy(request, *args, **kwargs)
