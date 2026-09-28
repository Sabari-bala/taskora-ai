"""Tests for the health check endpoint."""
import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_health_check_returns_ok(client):
    response = client.get(reverse("health"))
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert data["checks"]["api"] == "ok"
    assert data["checks"]["database"] == "ok"


@pytest.mark.django_db
def test_health_check_is_public(client):
    """Health check must not require authentication."""
    response = client.get(reverse("health"))
    assert response.status_code != 401
    assert response.status_code != 403