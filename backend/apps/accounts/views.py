from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


def _set_refresh_cookie(response, refresh_token):
    """Attach the refresh token as an HttpOnly cookie."""
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
    """Create access + refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": refresh,
    }


class RegisterView(APIView):
    """POST /api/v1/auth/register/ — create a new user and log them in."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        tokens = _issue_tokens(user)
        response = Response(
            {
                "user": UserSerializer(user).data,
                "access": tokens["access"],
            },
            status=status.HTTP_201_CREATED,
        )
        return _set_refresh_cookie(response, tokens["refresh"])


@method_decorator(ensure_csrf_cookie, name="dispatch")
class LoginView(APIView):
    """POST /api/v1/auth/login/ — authenticate and issue tokens."""

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
            {
                "user": UserSerializer(user).data,
                "access": tokens["access"],
            },
            status=status.HTTP_200_OK,
        )
        return _set_refresh_cookie(response, tokens["refresh"])


@method_decorator(csrf_protect, name="dispatch")
class RefreshView(APIView):
    """POST /api/v1/auth/refresh/ — rotate tokens using the cookie."""

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

        # ROTATE_REFRESH_TOKENS=True → blacklist happens automatically
        try:
            old_refresh.blacklist()
        except AttributeError:
            pass  # blacklist app might be disabled; ignore gracefully

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
            {
                "user": UserSerializer(user).data,
                "access": tokens["access"],
            },
            status=status.HTTP_200_OK,
        )
        return _set_refresh_cookie(response, tokens["refresh"])


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — blacklist refresh and clear cookie."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw_refresh = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if raw_refresh:
            try:
                RefreshToken(raw_refresh).blacklist()
            except TokenError:
                pass

        response = Response(
            {"detail": "Logged out."},
            status=status.HTTP_200_OK,
        )
        return _clear_refresh_cookie(response)


class MeView(APIView):
    """GET/PATCH /api/v1/auth/me/ — read or update the current user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
