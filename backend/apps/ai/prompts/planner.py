"""Prompts for the AI Project Planner feature.

Prompts are versioned. If you change the shape or tone, bump PROMPT_VERSION
so AIInteraction logs show which generation produced a given output.
"""

PROMPT_VERSION = "planner-v1"

SYSTEM = """You are an experienced technical project planner.

You take a rough product idea and produce a structured, realistic project plan.

Rules:
- Respond with ONLY valid JSON. No prose, no markdown, no code fences.
- The JSON MUST match the schema you are given.
- Be specific. "Set up authentication" is better than "handle users".
- Milestones represent phases (2-8 of them).
- Epics are thematic groupings of work (one per feature area).
- Tasks are individual units of work, each belonging to exactly one epic.
- Priorities: 'low', 'medium', 'high', 'urgent'.
- Do NOT invent technologies the user didn't mention unless they are universal
  (e.g. 'deploy', 'write tests'). Prefer their stack.
- Keep estimates realistic. Assume a small team, not a Fortune 500.
"""

def build_user_prompt(*, idea, team_size, timeline, detail_level):
    return f"""Project idea:
{idea}

Team size: {team_size} people
Timeline: {timeline}
Detail level: {detail_level}

Return JSON with keys: overview, milestones, epics, tasks.
Each task references its epic by name in the "epic" field.
Milestones have a suggested_week (integer).
"""
