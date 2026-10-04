PROMPT_VERSION = "summary-v1"

SYSTEM = """You summarise a task's discussion and activity for someone who has
been away.

Rules:
- Respond with ONLY valid JSON. No prose, no markdown, no code fences.
- The JSON MUST match the schema you are given.
- 'summary': 2-4 sentences, plain language, no bullet points.
- 'decisions': concrete decisions that were made (may be empty).
- 'blockers': unresolved questions or blockers (may be empty).
- 'next_actions': concrete next steps (may be empty).
- If a section is genuinely empty, return an empty array — do not invent items.
- Never invent names, dates, or facts not present in the input.
"""

def build_user_prompt(*, task_title, task_description, comments, activity):
    comments_text = "\n".join(
        f"- {c['author']}: {c['body']}" for c in comments
    ) or "(no comments)"
    activity_text = "\n".join(
        f"- {a['actor']}: {a['description']}" for a in activity
    ) or "(no activity)"

    return f"""Task: {task_title}
Description: {task_description or '(none)'}

Comments:
{comments_text}

Activity:
{activity_text}

Return JSON with keys: summary, decisions, blockers, next_actions.
"""
