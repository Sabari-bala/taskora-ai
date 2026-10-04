"""JSON schema for the AI Task Summarization response."""

TASK_SUMMARY_SCHEMA = {
    "type": "object",
    "required": ["summary", "decisions", "blockers", "next_actions"],
    "properties": {
        "summary": {"type": "string", "minLength": 10, "maxLength": 800},
        "decisions": {
            "type": "array",
            "maxItems": 10,
            "items": {"type": "string", "maxLength": 300},
        },
        "blockers": {
            "type": "array",
            "maxItems": 10,
            "items": {"type": "string", "maxLength": 300},
        },
        "next_actions": {
            "type": "array",
            "maxItems": 10,
            "items": {"type": "string", "maxLength": 300},
        },
    },
}
