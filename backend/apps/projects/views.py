from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.workspaces.models import Workspace, WorkspaceMember

from .models import Label, Milestone, Project, Task
from .permissions import CanManageProject
from .serializers import (
    LabelSerializer,
    MilestoneSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectWriteSerializer,
)
from .services import board_data, create_project, project_analytics


def _role(user, workspace):
    m = WorkspaceMember.objects.filter(workspace=workspace, user=user).first()
    return m.role if m else None


@extend_schema(tags=['projects'])
class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        qs = (
            Project.objects
            .filter(workspace__memberships__user=self.request.user)
            .select_related('lead', 'workspace')
            .annotate(
                task_count=Count('tasks', distinct=True),
                completed_task_count=Count(
                    'tasks', filter=Q(tasks__status=Task.Status.DONE), distinct=True
                ),
            )
            .distinct()
        )
        params = self.request.query_params
        if workspace := params.get('workspace'):
            qs = qs.filter(workspace_id=workspace)
        if status_param := params.get('status'):
            qs = qs.filter(status=status_param)
        if search := params.get('search'):
            qs = qs.filter(Q(name__icontains=search) | Q(key__icontains=search))
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProjectWriteSerializer
        return ProjectDetailSerializer

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), CanManageProject()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        workspace_id = request.data.get('workspace')
        if not workspace_id:
            raise ValidationError({'workspace': 'This field is required.'})
        workspace = get_object_or_404(Workspace, id=workspace_id)
        role = _role(request.user, workspace)
        if role not in (
            WorkspaceMember.Role.OWNER,
            WorkspaceMember.Role.ADMIN,
            WorkspaceMember.Role.MANAGER,
        ):
            raise PermissionDenied('You need manager permissions to create projects.')
        write = ProjectWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        try:
            project = create_project(workspace=workspace, **write.validated_data)
        except ValueError as e:
            raise ValidationError({'key': str(e)})
        project = self.get_queryset().get(pk=project.pk)
        return Response(
            ProjectDetailSerializer(project).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get'])
    def board(self, request, id=None):
        project = self.get_object()
        columns = board_data(project)
        from apps.tasks.serializers import TaskListSerializer
        payload = {
            key: TaskListSerializer(tasks, many=True).data
            for key, tasks in columns.items()
        }
        return Response(payload)

    @action(detail=True, methods=['get'])
    def analytics(self, request, id=None):
        project = self.get_object()
        return Response(project_analytics(project))


@extend_schema(tags=['projects'])
class MilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Milestone.objects.filter(
            project__workspace__memberships__user=self.request.user,
            project_id=self.kwargs['project_id'],
        ).distinct()

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        role = _role(self.request.user, project.workspace)
        if role in (None, WorkspaceMember.Role.VIEWER):
            raise PermissionDenied('Viewers cannot create milestones.')
        serializer.save(project=project)


@extend_schema(tags=['projects'])
class LabelViewSet(viewsets.ModelViewSet):
    serializer_class = LabelSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        qs = Label.objects.filter(
            workspace__memberships__user=self.request.user
        ).distinct()
        if workspace_id := self.request.query_params.get('workspace'):
            qs = qs.filter(workspace_id=workspace_id)
        return qs

    def perform_create(self, serializer):
        workspace_id = self.request.data.get('workspace')
        workspace = get_object_or_404(Workspace, id=workspace_id)
        role = _role(self.request.user, workspace)
        if role in (None, WorkspaceMember.Role.VIEWER):
            raise PermissionDenied('Viewers cannot create labels.')
        serializer.save(workspace=workspace)
