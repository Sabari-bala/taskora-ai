PROMPT_VERSION = "breakdown-v1"

SYSTEM = """You decompose a single task into ordered subtasks.

Rules:
- Respond with ONLY valid JSON. No prose, no markdown, no code fences.
- The JSON MUST match the schema you are given.
- 2-15 subtasks. Prefer fewer, meatier subtasks over many tiny ones.
- Subtasks should be sequential where possible.
- Do not include the parent task itself as a subtask.
"""

def build_user_prompt(*, title, description, project_key):
    desc = description.strip() or "(no description provided)"
    return f"""Project: {project_key}
Task title: {title}
Task description:
{desc}

Return JSON with a single key: subtasks (list of objects).
"""
