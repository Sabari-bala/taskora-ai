
from django.db.models import Count
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Workspace, WorkspaceMember
from .permissions import IsWorkspaceAdmin
from .serializers import (
    AddMemberSerializer,
    ChangeRoleSerializer,
    WorkspaceMemberSerializer,
    WorkspaceSerializer,
)
from .services import create_workspace


@extend_schema(tags=["workspaces"])
class WorkspaceViewSet(viewsets.ModelViewSet):
    '''
    CRUD for workspaces the current user belongs to.
    '''

    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return (
            Workspace.objects.filter(memberships__user=self.request.user)
            .annotate(member_count=Count("memberships", distinct=True))
            .select_related("owner")
            .distinct()
        )

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsWorkspaceAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        workspace = create_workspace(
            owner=self.request.user,
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description", ""),
        )
        serializer.instance = workspace

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Re-serialize with the annotated queryset so member_count shows up
        instance = self.get_queryset().get(pk=serializer.instance.pk)
        output = self.get_serializer(instance)
        return Response(output.data, status=status.HTTP_201_CREATED)


class WorkspaceMemberListView(APIView):
    '''
    GET  /api/v1/workspaces/<id>/members/  — list members
    POST /api/v1/workspaces/<id>/members/  — invite a user by email
    '''

    permission_classes = [IsAuthenticated]

    def _get_workspace(self, request, workspace_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)
        if not WorkspaceMember.objects.filter(
            workspace=workspace, user=request.user
        ).exists():
            raise PermissionDenied("You are not a member of this workspace.")
        return workspace

    @extend_schema(responses=WorkspaceMemberSerializer(many=True))
    def get(self, request, workspace_id):
        workspace = self._get_workspace(request, workspace_id)
        members = WorkspaceMember.objects.filter(
            workspace=workspace
        ).select_related("user")
        return Response(WorkspaceMemberSerializer(members, many=True).data)

    @extend_schema(request=AddMemberSerializer)
    def post(self, request, workspace_id):
        workspace = self._get_workspace(request, workspace_id)

        actor_role = WorkspaceMember.objects.get(
            workspace=workspace, user=request.user
        ).role
        if actor_role not in (
            WorkspaceMember.Role.OWNER,
            WorkspaceMember.Role.ADMIN,
        ):
            raise PermissionDenied("Only owners and admins can invite members.")

        serializer = AddMemberSerializer(
            data=request.data,
            context={"workspace": workspace, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        member = serializer.save()
        return Response(
            WorkspaceMemberSerializer(member).data,
            status=status.HTTP_201_CREATED,
        )


class WorkspaceMemberDetailView(APIView):
    '''
    PATCH  /api/v1/workspaces/<id>/members/<member_id>/  — change role
    DELETE /api/v1/workspaces/<id>/members/<member_id>/  — remove member
    '''

    permission_classes = [IsAuthenticated]

    def _get_member(self, request, workspace_id, member_id):
        workspace = get_object_or_404(Workspace, id=workspace_id)

        actor = WorkspaceMember.objects.filter(
            workspace=workspace, user=request.user
        ).first()
        if actor is None:
            raise PermissionDenied("You are not a member of this workspace.")

        member = get_object_or_404(
            WorkspaceMember, id=member_id, workspace=workspace
        )
        return workspace, actor, member

    @extend_schema(request=ChangeRoleSerializer)
    def patch(self, request, workspace_id, member_id):
        workspace, actor, member = self._get_member(
            request, workspace_id, member_id
        )

        if actor.role not in (
            WorkspaceMember.Role.OWNER,
            WorkspaceMember.Role.ADMIN,
        ):
            raise PermissionDenied("Only owners and admins can change roles.")

        if member.role == WorkspaceMember.Role.OWNER:
            raise ValidationError("Cannot change the owner's role.")

        serializer = ChangeRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member.role = serializer.validated_data["role"]
        member.save(update_fields=["role"])
        return Response(WorkspaceMemberSerializer(member).data)

    def delete(self, request, workspace_id, member_id):
        workspace, actor, member = self._get_member(
            request, workspace_id, member_id
        )

        if actor.role not in (
            WorkspaceMember.Role.OWNER,
            WorkspaceMember.Role.ADMIN,
        ):
            raise PermissionDenied("Only owners and admins can remove members.")

        if member.role == WorkspaceMember.Role.OWNER:
            raise ValidationError("The workspace owner cannot be removed.")

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
