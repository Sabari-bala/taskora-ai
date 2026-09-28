"""
Custom DRF exception handler.
Normalises all error responses to a consistent shape:

    {"detail": "...", "errors": {"field": ["..."]}}
"""

import logging

from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("taskora")


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is None:
        # Unhandled exception — let Django 500 handle it
        logger.exception("Unhandled exception in %s", context.get("view"))
        return None

    # If response.data isn't a dict (rare), leave it alone
    if not isinstance(response.data, dict):
        return response

    # Already shaped correctly
    if "detail" in response.data and len(response.data) == 1:
        return response

    # Wrap field errors under "errors"
    if "detail" not in response.data:
        detail = _default_detail(response.status_code)
        response.data = {"detail": detail, "errors": response.data}

    return response


def _default_detail(status_code: int) -> str:
    mapping = {
        400: "Validation error.",
        401: "Authentication required.",
        403: "You do not have permission to perform this action.",
        404: "Resource not found.",
        405: "Method not allowed.",
        429: "Too many requests. Try again later.",
        500: "Internal server error.",
    }
    return mapping.get(status_code, "Request failed.")
