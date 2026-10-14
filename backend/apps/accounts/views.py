import logging

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core import signing
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .emails import send_email_change_verification
from .serializers import (
    EmailChangeRequestSerializer,
    EmailChangeVerifySerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .tokens import make_email_change_token, read_email_change_token

User = get_user_model()
logger = logging.getLogger("taskora")


def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=str(refresh_token),
        max_age=settings.REFRESH_COOKIE_MAX_AGE,
        path=settings.REFRESH_COOKIE_PATH,
        secure=settings.REFRESH_COOKIE_SECURE,
        httponly=True,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )
    return response


def _clear_refresh_cookie(response):
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
    )
    return response


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": refresh,
    }


@extend_schema(
    summary="Register a new user",
    description="Creates a new account and returns an access token. "
    "Sets a refresh token as an HttpOnly cookie.",
    request=RegisterSerializer,
    responses={
        201: OpenApiResponse(description="Account created and logged in."),
        400: OpenApiResponse(description="Validation error."),
    },
    tags=["auth"],
)
class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        tokens = _issue_tokens(user)
        response = Response(
            {"user": UserSerializer(user).data, "access": tokens["access"]},
            status=status.HTTP_201_CREATED,
        )
        return _set_refresh_cookie(response, tokens["refresh"])


@extend_schema(
    summary="Log in",
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(description="Logged in successfully."),
        401: OpenApiResponse(description="Invalid credentials."),
    },
    tags=["auth"],
)
@method_decorator(ensure_csrf_cookie, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower()
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"detail": "This account is inactive."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = _issue_tokens(user)
        response = Response(
            {"user": UserSerializer(user).data, "access": tokens["access"]},
            status=status.HTTP_200_OK,
        )
        return _set_refresh_cookie(response, tokens["refresh"])


@extend_schema(
    summary="Refresh access token",
    request=None,
    responses={
        200: OpenApiResponse(description="New access token issued."),
        401: OpenApiResponse(description="Missing or invalid refresh token."),
    },
    tags=["auth"],
)
@method_decorator(csrf_protect, name="dispatch")
class RefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_refresh = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not raw_refresh:
            return Response(
                {"detail": "No refresh token provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            old_refresh = RefreshToken(raw_refresh)
        except TokenError:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            old_refresh.blacklist()
        except Exception:
            pass

        user_id = old_refresh.get("user_id")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User no longer exists."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = _issue_tokens(user)
        response = Response(
            {"user": UserSerializer(user).data, "access": tokens["access"]},
            status=status.HTTP_200_OK,
        )
        return _set_refresh_cookie(response, tokens["refresh"])


@extend_schema(
    summary="Log out",
    request=None,
    responses={200: OpenApiResponse(description="Logged out.")},
    tags=["auth"],
)
@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw_refresh = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if raw_refresh:
            try:
                RefreshToken(raw_refresh).blacklist()
            except Exception:
                pass

        response = Response({"detail": "Logged out."}, status=status.HTTP_200_OK)
        return _clear_refresh_cookie(response)


@extend_schema(
    summary="Get or update current user",
    request=UserSerializer,
    responses={200: UserSerializer},
    tags=["auth"],
)
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@extend_schema(
    summary="Change password",
    request=PasswordChangeSerializer,
    responses={
        200: OpenApiResponse(description="Password updated."),
        400: OpenApiResponse(description="Wrong password or validation error."),
    },
    tags=["auth"],
)
class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"detail": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        logger.info("Password changed for user %s", user.email)

        return Response(
            {
                "detail": "Password updated. "
                "Other sessions stay logged in until they expire."
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    summary="Request an email change",
    description="Sends a verification link to the new email address. "
    "In dev, the link prints to the Django terminal.",
    request=EmailChangeRequestSerializer,
    tags=["auth"],
)
class EmailChangeRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EmailChangeRequestSerializer(
            data=request.data, context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data["new_email"]

        token = make_email_change_token(request.user, new_email)
        try:
            send_email_change_verification(request.user, new_email, token)
        except Exception:
            return Response(
                {"detail": "Could not send verification email. Try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"detail": f"Verification email sent to {new_email}."},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    summary="Verify an email change",
    description="Consumes a token from the verification link and updates the email.",
    request=EmailChangeVerifySerializer,
    tags=["auth"],
)
class EmailChangeVerifyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = EmailChangeVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]

        try:
            data = read_email_change_token(token)
        except signing.SignatureExpired:
            return Response(
                {"detail": "This verification link has expired. Request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except signing.BadSignature:
            return Response(
                {"detail": "This verification link is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=data["user_id"])
        except User.DoesNotExist:
            return Response(
                {"detail": "User no longer exists."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_email = data["new_email"].lower()
        if User.objects.filter(email__iexact=new_email).exclude(id=user.id).exists():
            return Response(
                {"detail": "That email is now in use by another account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_email = user.email
        user.email = new_email
        user.save(update_fields=["email"])
        logger.info("Email changed: %s -> %s", old_email, new_email)

        return Response(
            {"detail": "Email updated successfully.", "email": new_email},
            status=status.HTTP_200_OK,
        )
