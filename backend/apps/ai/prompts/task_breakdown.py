"""Prompts for the AI Task Breakdown feature.

Prompts are versioned. Bump PROMPT_VERSION whenever the shape changes.
"""

PROMPT_VERSION = "breakdown-v2"

SYSTEM = """You decompose a single task into ordered subtasks.

Rules:
- Respond with ONLY valid JSON. No prose, no markdown, no code fences.
- Use the EXACT field names shown in the example below.
- Produce 2 to 12 subtasks. Prefer fewer, meatier subtasks over many tiny ones.
- Subtasks should be sequential where possible.
- Do NOT include the parent task itself as a subtask.
- Priority must be one of: 'low', 'medium', 'high', 'urgent'.

The response MUST have exactly this shape (field names are case-sensitive):

{
  "subtasks": [
    {
      "title": "Design the subtask endpoint contract",
      "description": "Define request/response schema and error cases.",
      "priority": "high",
      "estimated_hours": 2
    }
  ]
}

CRITICAL:
- Each subtask uses `title` (not `name`).
- Each subtask uses `estimated_hours` (not `estimate_hours` or `estimate`).
- `description` and `estimated_hours` are optional but recommended.
"""


def build_user_prompt(*, title, description, project_key):
    desc = description.strip() or "(no description provided)"
    return f"""Project: {project_key}
Task title: {title}
Task description:
{desc}

Return JSON with a single key: subtasks (list of objects).
Follow the exact field names from the example in your instructions.
"""
