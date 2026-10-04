"""
JSON + schema validation for AI output.

Every AI response is treated as untrusted input. We:
1. Parse JSON — if it fails, we try one repair pass (strip fences, etc.)
2. Validate against the schema — if it fails, we raise AIValidationError
3. Return the dict — never return raw text to the caller.
"""
import json
import re

from jsonschema import Draft7Validator

from .exceptions import AIValidationError


_FENCE_PATTERN = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def _try_extract_json(text: str) -> str:
    """Repair common LLM formatting issues before parsing."""
    text = text.strip()

    # Strip code fences if present
    match = _FENCE_PATTERN.search(text)
    if match:
        text = match.group(1).strip()

    # Trim everything before the first { and after the last }
    first = text.find("{")
    last = text.rfind("}")
    if first != -1 and last != -1 and last > first:
        text = text[first : last + 1]

    return text


def parse_and_validate(raw_text: str, schema: dict) -> dict:
    """
    Parse JSON from raw_text and validate against schema.
    Raises AIValidationError on any failure.
    """
    if not raw_text or not isinstance(raw_text, str):
        raise AIValidationError("Empty AI response")

    cleaned = _try_extract_json(raw_text)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise AIValidationError(
            f"AI did not return valid JSON: {exc.msg}"
        ) from exc

    validator = Draft7Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda e: e.path)
    if errors:
        first = errors[0]
        path = ".".join(str(p) for p in first.path) or "<root>"
        raise AIValidationError(
            f"AI output does not match schema at {path}: {first.message}"
        )

    return data
