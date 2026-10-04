from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project, Task
from apps.workspaces.models import WorkspaceMember

from .assistant_serializers import (
    BreakdownTaskRequestSerializer,
    SummarizeTaskRequestSerializer,
)
from .assistant_service import breakdown_task, generate_insights, summarize_task
from .planner_views import _error_response
from .exceptions import AIError


def _check_member(user, workspace):
    m = WorkspaceMember.objects.filter(workspace=workspace, user=user).first()
    if not m:
        raise PermissionDenied("You are not a member of this workspace.")
    return m


@extend_schema(tags=["ai"])
class BreakdownTaskView(APIView):
    """POST /api/v1/ai/breakdown-task/ — propose subtasks. No DB writes."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=BreakdownTaskRequestSerializer)
    def post(self, request):
        serializer = BreakdownTaskRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = get_object_or_404(Task, id=serializer.validated_data["task_id"])
        _check_member(request.user, task.project.workspace)

        try:
            proposal = breakdown_task(user=request.user, task=task)
        except AIError as exc:
            return _error_response(exc)

        return Response({"proposal": proposal})


@extend_schema(tags=["ai"])
class SummarizeTaskView(APIView):
    """POST /api/v1/ai/summarize-task/ — summarize a task thread."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=SummarizeTaskRequestSerializer)
    def post(self, request):
        serializer = SummarizeTaskRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = get_object_or_404(Task, id=serializer.validated_data["task_id"])
        _check_member(request.user, task.project.workspace)

        try:
            summary = summarize_task(user=request.user, task=task)
        except AIError as exc:
            return _error_response(exc)

        return Response({"summary": summary})


@extend_schema(tags=["ai"])
class ProjectInsightsView(APIView):
    """GET /api/v1/ai/project-insights/?project=<id>"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get("project")
        if not project_id:
            return Response(
                {"detail": "Query parameter 'project' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project = get_object_or_404(Project, id=project_id)
        _check_member(request.user, project.workspace)

        try:
            insights = generate_insights(user=request.user, project=project)
        except AIError as exc:
            return _error_response(exc)

        return Response({"insights": insights})
