"""Root URL configuration."""
from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def root_view(request):
    """Simple landing page so the root URL is not a 404."""
    return JsonResponse(
        {
            "name": "Taskora AI API",
            "version": "1.0.0",
            "docs": "/api/docs/",
            "schema": "/api/schema/",
            "health": "/api/v1/health/",
            "admin": "/admin/",
        }
    )


urlpatterns = [
    path("", root_view, name="root"),
    path("admin/", admin.site.urls),
    path("api/v1/", include("config.api_urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
    except ImportError:
        pass
