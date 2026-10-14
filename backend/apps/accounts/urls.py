from django.urls import path

from .views import (
    EmailChangeRequestView,
    EmailChangeVerifyView,
    LoginView,
    LogoutView,
    MeView,
    PasswordChangeView,
    RefreshView,
    RegisterView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", PasswordChangeView.as_view(), name="change-password"),
    path("change-email/", EmailChangeRequestView.as_view(), name="change-email"),
    path(
        "verify-email-change/",
        EmailChangeVerifyView.as_view(),
        name="verify-email-change",
    ),
]
