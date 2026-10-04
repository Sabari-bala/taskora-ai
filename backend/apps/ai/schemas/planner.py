"""JSON schema for the AI Project Planner response."""

PROJECT_PLAN_SCHEMA = {
    "type": "object",
    "required": ["overview", "milestones", "epics", "tasks"],
    "properties": {
        "overview": {"type": "string", "minLength": 10, "maxLength": 1200},
        "milestones": {
            "type": "array",
            "minItems": 1,
            "maxItems": 8,
            "items": {
                "type": "object",
                "required": ["title", "description"],
                "properties": {
                    "title": {"type": "string", "maxLength": 200},
                    "description": {"type": "string", "maxLength": 600},
                    "suggested_week": {"type": "integer", "minimum": 1, "maximum": 52},
                },
            },
        },
        "epics": {
            "type": "array",
            "minItems": 1,
            "maxItems": 12,
            "items": {
                "type": "object",
                "required": ["name"],
                "properties": {
                    "name": {"type": "string", "maxLength": 100},
                    "description": {"type": "string", "maxLength": 400},
                },
            },
        },
        "tasks": {
            "type": "array",
            "minItems": 3,
            "maxItems": 60,
            "items": {
                "type": "object",
                "required": ["title", "epic", "priority"],
                "properties": {
                    "title": {"type": "string", "maxLength": 250},
                    "description": {"type": "string", "maxLength": 800},
                    "epic": {"type": "string", "maxLength": 100},
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                    },
                    "estimated_hours": {
                        "type": "number", "minimum": 0.5, "maximum": 80,
                    },
                    "milestone_title": {"type": "string", "maxLength": 200},
                },
            },
        },
    },
}
