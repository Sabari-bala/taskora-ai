"""Health check endpoint — verifies API, database, and app version."""
from django.db import connection
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

API_VERSION = "1.0.0"


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Liveness/readiness probe.
    Returns 200 if all critical subsystems respond, 503 otherwise.
    """
    checks = {"api": "ok", "database": "unknown"}

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "error"

    healthy = all(v == "ok" for v in checks.values())
    return Response(
        {
            "status": "ok" if healthy else "degraded",
            "version": API_VERSION,
            "checks": checks,
        },
        status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
    )