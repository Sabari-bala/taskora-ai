
from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Workspace, WorkspaceMember

User = get_user_model()


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    '''Read representation of a workspace member, with nested user info.'''

    user = UserSerializer(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = ["id", "user", "role", "joined_at"]
        read_only_fields = ["id", "user", "joined_at"]


class WorkspaceSerializer(serializers.ModelSerializer):
    '''Read/write representation of a workspace.'''

    owner = UserSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True, default=0)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "owner",
            "member_count",
            "my_role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def get_my_role(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(user=request.user).first()
        return membership.role if membership else None


class AddMemberSerializer(serializers.Serializer):
    '''Invite a user by email with a role.'''

    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=WorkspaceMember.Role.choices,
        default=WorkspaceMember.Role.MEMBER,
    )

    def validate_email(self, value):
        try:
            user = User.objects.get(email__iexact=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No user with this email address exists."
            )
        self._user = user
        return value.lower()

    def validate_role(self, value):
        if value == WorkspaceMember.Role.OWNER:
            raise serializers.ValidationError(
                "Cannot invite someone as OWNER. Transfer ownership separately."
            )
        return value

    def validate(self, attrs):
        workspace = self.context.get("workspace")
        if workspace and WorkspaceMember.objects.filter(
            workspace=workspace, user=self._user
        ).exists():
            raise serializers.ValidationError(
                {"email": "This user is already a member of the workspace."}
            )
        return attrs

    def create(self, validated_data):
        from .services import add_member

        return add_member(
            workspace=self.context["workspace"],
            user=self._user,
            role=validated_data["role"],
            invited_by=self.context["request"].user,
        )


class ChangeRoleSerializer(serializers.Serializer):
    '''Change a member role. Owner role cannot be assigned here.'''

    role = serializers.ChoiceField(choices=WorkspaceMember.Role.choices)

    def validate_role(self, value):
        if value == WorkspaceMember.Role.OWNER:
            raise serializers.ValidationError(
                "Cannot promote to OWNER. Transfer ownership separately."
            )
        return value
