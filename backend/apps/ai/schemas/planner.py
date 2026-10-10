"""JSON schema for the AI Project Planner response."""

PROJECT_PLAN_SCHEMA = {
    "type": "object",
    "required": ["overview", "milestones", "epics", "tasks"],
    "properties": {
        "overview": {"type": "string", "minLength": 10, "maxLength": 2000},
        "milestones": {
            "type": "array",
            "minItems": 1,
            "maxItems": 12,
            "items": {
                "type": "object",
                "required": ["title"],
                "properties": {
                    "title": {"type": "string", "maxLength": 200},
                    "description": {"type": "string", "maxLength": 800},
                    "suggested_week": {"type": "integer", "minimum": 1, "maximum": 104},
                },
            },
        },
        "epics": {
            "type": "array",
            "minItems": 1,
            "maxItems": 20,
            "items": {
                "type": "object",
                "required": ["name"],
                "properties": {
                    "name": {"type": "string", "maxLength": 100},
                    "description": {"type": "string", "maxLength": 500},
                },
            },
        },
        "tasks": {
            "type": "array",
            "minItems": 1,
            "maxItems": 100,
            "items": {
                "type": "object",
                "required": ["title", "priority"],
                "properties": {
                    "title": {"type": "string", "maxLength": 300},
                    "description": {"type": "string", "maxLength": 1200},
                    "epic": {"type": "string", "maxLength": 100},
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                    },
                    "estimated_hours": {
                        "type": "number", "minimum": 0.25, "maximum": 200,
                    },
                    "milestone_title": {"type": "string", "maxLength": 200},
                },
            },
        },
    },
}
