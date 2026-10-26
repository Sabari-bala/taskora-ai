import pytest


@pytest.fixture(autouse=True)
def _disable_ssl_redirect_for_tests(settings):
    """Force-disable SSL redirect for every test, regardless of settings module."""
    settings.SECURE_SSL_REDIRECT = False
    settings.SECURE_PROXY_SSL_HEADER = None
    settings.ALLOWED_HOSTS = list(settings.ALLOWED_HOSTS) + ["testserver"]
