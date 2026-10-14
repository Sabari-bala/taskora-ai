from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of a user for API responses."""

    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "display_name",
            "avatar",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined", "display_name"]


class RegisterSerializer(serializers.ModelSerializer):
    """Creates a new user with proper password hashing and validation."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ["email", "full_name", "password"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    """Validates credentials for login. Does not authenticate directly."""

    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )


class PasswordChangeSerializer(serializers.Serializer):
    """Change password. Requires the current password as proof."""

    old_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["old_password"] == attrs["new_password"]:
            raise serializers.ValidationError(
                {"new_password": "New password must be different."}
            )
        return attrs


class EmailChangeRequestSerializer(serializers.Serializer):
    """Request an email change. Sends a verification link to the new address."""

    new_email = serializers.EmailField()

    def validate_new_email(self, value):
        value = value.lower().strip()
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if request.user.email.lower() == value:
                raise serializers.ValidationError("That is already your email.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "This email is already used by another account."
            )
        return value


class EmailChangeVerifySerializer(serializers.Serializer):
    token = serializers.CharField()
