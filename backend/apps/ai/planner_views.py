from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.workspaces.models import Workspace, WorkspaceMember

from .exceptions import (
    AIError,
    AIQuotaExceededError,
    AIRateLimitError,
    AITimeoutError,
    AIValidationError,
)
from .planner_serializers import (
    CommitPlanSerializer,
    PlanProjectRequestSerializer,
)
from .planner_service import commit_plan, generate_plan


def _error_response(exc):
    """Map AI exceptions to clean HTTP responses. Never leaks raw errors."""
    if isinstance(exc, AIQuotaExceededError):
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    if isinstance(exc, AIRateLimitError):
        return Response(
            {"detail": "AI provider is rate-limited. Try again shortly."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    if isinstance(exc, AITimeoutError):
        return Response(
            {"detail": "AI took too long to respond. Please try again."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    if isinstance(exc, AIValidationError):
        return Response(
            {"detail": "AI produced an unexpected format. Please try again."},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    if isinstance(exc, AIError):
        return Response(
            {"detail": "AI is temporarily unavailable. Please try again."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    raise exc


@extend_schema(tags=["ai"])
class PlanProjectView(APIView):
    """POST /api/v1/ai/plan-project/ — generate a plan. No DB writes."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=PlanProjectRequestSerializer)
    def post(self, request):
        serializer = PlanProjectRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        workspace = get_object_or_404(Workspace, id=data["workspace_id"])
        if not WorkspaceMember.objects.filter(
            workspace=workspace, user=request.user
        ).exists():
            raise PermissionDenied("You are not a member of this workspace.")

        try:
            proposal = generate_plan(
                user=request.user,
                workspace=workspace,
                idea=data["idea"],
                team_size=data["team_size"],
                timeline=data["timeline"],
                detail_level=data["detail_level"],
            )
        except AIError as exc:
            return _error_response(exc)

        return Response({"proposal": proposal})


@extend_schema(tags=["ai"])
class PlanProjectCommitView(APIView):
    """POST /api/v1/ai/plan-project/commit/ — persist the accepted subset."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=CommitPlanSerializer)
    def post(self, request):
        serializer = CommitPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        workspace = get_object_or_404(Workspace, id=data["workspace_id"])
        membership = WorkspaceMember.objects.filter(
            workspace=workspace, user=request.user
        ).first()
        if not membership:
            raise PermissionDenied("You are not a member of this workspace.")
        if membership.role == WorkspaceMember.Role.VIEWER:
            raise PermissionDenied("Viewers cannot create projects.")

        try:
            result = commit_plan(
                user=request.user,
                workspace=workspace,
                project_name=data["project_name"],
                project_key=data["project_key"],
                project_description=data.get("project_description", ""),
                milestones=data.get("milestones", []),
                tasks=data["tasks"],
            )
        except ValueError as exc:
            raise ValidationError({"project_key": str(exc)})

        return Response(result, status=status.HTTP_201_CREATED)
