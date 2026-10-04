"""JSON schema for the AI Task Breakdown response."""

TASK_BREAKDOWN_SCHEMA = {
    "type": "object",
    "required": ["subtasks"],
    "properties": {
        "subtasks": {
            "type": "array",
            "minItems": 2,
            "maxItems": 15,
            "items": {
                "type": "object",
                "required": ["title", "priority"],
                "properties": {
                    "title": {"type": "string", "maxLength": 250},
                    "description": {"type": "string", "maxLength": 500},
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                    },
                    "estimated_hours": {
                        "type": "number", "minimum": 0.25, "maximum": 40,
                    },
                },
            },
        },
    },
}
