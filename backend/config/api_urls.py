"""API v1 URL configuration."""
from django.urls import include, path

from common.health import health_check

urlpatterns = [
    path("health/", health_check, name="health"),
    path("auth/", include("apps.accounts.urls")),
    path("", include("apps.workspaces.urls")),
]
