from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.projects.models import Project, Task
from apps.workspaces.models import WorkspaceMember

from .serializers import (
    ReorderSerializer,
    TaskActivitySerializer,
    TaskDetailSerializer,
    TaskListSerializer,
    TaskWriteSerializer,
)
from .services import create_task, next_position, reorder_task, update_task


def _role(user, workspace):
    m = WorkspaceMember.objects.filter(workspace=workspace, user=user).first()
    return m.role if m else None


@extend_schema(tags=['tasks'])
class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = (
            Task.objects
            .filter(project__workspace__memberships__user=self.request.user)
            .select_related('assignee', 'created_by', 'project')
            .prefetch_related('labels')
            .distinct()
        )
        params = self.request.query_params
        if v := params.get('project'):
            qs = qs.filter(project_id=v)
        if v := params.get('status'):
            qs = qs.filter(status=v)
        if v := params.get('priority'):
            qs = qs.filter(priority=v)
        if v := params.get('assignee'):
            qs = qs.filter(assignee_id=v)
        if v := params.get('due_before'):
            qs = qs.filter(due_date__lte=v)
        if v := params.get('search'):
            qs = qs.filter(
                Q(title__icontains=v) | Q(description__icontains=v)
            )
        if params.get('mine') == 'true':
            qs = qs.filter(assignee=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return TaskWriteSerializer
        if self.action == 'activity':
            return TaskActivitySerializer
        return TaskDetailSerializer

    def create(self, request, *args, **kwargs):
        project_id = request.data.get('project')
        if not project_id:
            raise ValidationError({'project': 'This field is required.'})
        project = get_object_or_404(Project, id=project_id)
        role = _role(request.user, project.workspace)
        if role is None:
            raise PermissionDenied('You are not a member of this workspace.')
        if role == WorkspaceMember.Role.VIEWER:
            raise PermissionDenied('Viewers cannot create tasks.')
        serializer = TaskWriteSerializer(
            data=request.data,
            context={'project': project, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data.copy()
        labels = data.pop('labels', [])
        if 'position' not in data:
            data['position'] = next_position(
                project=project, status=data.get('status', 'backlog')
            )
        task = create_task(project=project, actor=request.user, **data)
        if labels:
            task.labels.set(labels)
        return Response(
            TaskDetailSerializer(task).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        role = _role(request.user, task.project.workspace)
        if role in (None, WorkspaceMember.Role.VIEWER):
            raise PermissionDenied('Viewers cannot edit tasks.')
        partial = kwargs.pop('partial', False)
        serializer = TaskWriteSerializer(
            data=request.data, partial=partial,
            context={'project': task.project, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data.copy()
        labels = data.pop('labels', None)
        task = update_task(task=task, actor=request.user, **data)
        if labels is not None:
            task.labels.set(labels)
        return Response(TaskDetailSerializer(task).data)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        role = _role(request.user, task.project.workspace)
        if role in (None, WorkspaceMember.Role.VIEWER):
            raise PermissionDenied('Viewers cannot delete tasks.')
        return super().destroy(request, *args, **kwargs)

    @extend_schema(request=ReorderSerializer)
    @action(detail=True, methods=['post'])
    def reorder(self, request, id=None):
        task = self.get_object()
        role = _role(request.user, task.project.workspace)
        if role in (None, WorkspaceMember.Role.VIEWER):
            raise PermissionDenied('Viewers cannot reorder tasks.')
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = reorder_task(
            task=task, actor=request.user,
            new_status=serializer.validated_data['status'],
            new_position=serializer.validated_data['position'],
        )
        return Response(TaskDetailSerializer(task).data)

    @extend_schema(responses=TaskActivitySerializer(many=True))
    @action(detail=True, methods=['get'])
    def activity(self, request, id=None):
        task = self.get_object()
        activities = task.activities.select_related('actor')
        return Response(TaskActivitySerializer(activities, many=True).data)
