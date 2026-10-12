from apps.analytics.services import dashboard_summary
from apps.projects.models import Task
from apps.projects.services import project_analytics

from .models import AIInteraction
from .prompts import summarization, task_breakdown
from .schemas import TASK_BREAKDOWN_SCHEMA, TASK_SUMMARY_SCHEMA
from .services import call_ai


def _normalize_breakdown(data: dict) -> dict:
    """Map common LLM aliases into canonical field names for breakdown."""
    if not isinstance(data, dict):
        return data

    raw = data.get("subtasks") or data.get("tasks") or data.get("items") or []
    subtasks = []
    for st in raw:
        if isinstance(st, str):
            subtasks.append({"title": st, "priority": "medium"})
            continue
        if not isinstance(st, dict):
            continue

        hours = st.get("estimated_hours")
        if hours is None:
            hours = st.get("estimate_hours")
        if hours is None:
            hours = st.get("estimate")

        priority = (st.get("priority") or "medium").lower()
        if priority not in ("low", "medium", "high", "urgent"):
            priority = "medium"

        item = {
            "title": st.get("title") or st.get("name") or "",
            "priority": priority,
        }
        if st.get("description"):
            item["description"] = st["description"]
        if hours is not None:
            item["estimated_hours"] = hours
        subtasks.append(item)

    return {"subtasks": subtasks}


def breakdown_task(*, user, task):
    """Turn a task into a list of ordered subtasks. No DB writes."""
    user_prompt = task_breakdown.build_user_prompt(
        title=task.title,
        description=task.description or "",
        project_key=task.project.key,
    )
    return call_ai(
        feature=AIInteraction.Feature.BREAKDOWN_TASK,
        system_prompt=task_breakdown.SYSTEM,
        user_prompt=user_prompt,
        schema=TASK_BREAKDOWN_SCHEMA,
        user=user,
        workspace=task.project.workspace,
        normalizer=_normalize_breakdown,
    )


def _normalize_summary(data: dict) -> dict:
    """Ensure summary result has all required keys with sensible defaults."""
    if not isinstance(data, dict):
        return data
    def _as_list(v):
        if isinstance(v, list):
            return [str(x) for x in v if x]
        if isinstance(v, str) and v.strip():
            return [v.strip()]
        return []
    return {
        "summary": data.get("summary") or "No summary available.",
        "decisions": _as_list(data.get("decisions")),
        "blockers": _as_list(data.get("blockers")),
        "next_actions": _as_list(data.get("next_actions")),
    }


def summarize_task(*, user, task):
    """Summarize comments + activity into decisions, blockers, next actions."""
    from django.db.models import F

    comments = list(
        task.comments.select_related("author").values(
            "body", author_name=F("author__full_name")
        )[:30]
    )
    comments_data = [
        {"author": c["author_name"] or "Someone", "body": c["body"]}
        for c in comments
    ]

    activity = [
        {"actor": a.actor.display_name if a.actor else "Someone",
         "description": a.human_readable}
        for a in task.activities.select_related("actor")[:20]
    ]

    user_prompt = summarization.build_user_prompt(
        task_title=task.title,
        task_description=task.description or "",
        comments=comments_data,
        activity=activity,
    )
    return call_ai(
        feature=AIInteraction.Feature.SUMMARIZE_TASK,
        system_prompt=summarization.SYSTEM,
        user_prompt=user_prompt,
        schema=TASK_SUMMARY_SCHEMA,
        user=user,
        workspace=task.project.workspace,
        normalizer=_normalize_summary,
    )


INSIGHTS_SYSTEM = """You are a project analyst. You will receive REAL statistics
computed from a project management database. Your job is to interpret them.

Rules:
- Respond with ONLY valid JSON. No prose, no markdown, no code fences.
- The JSON must match the schema you are given.
- NEVER invent statistics. If a number is not in the input, do not mention it.
- Be specific. Reference real assignee names, real counts, real trends.
- If everything looks healthy, say so — do not manufacture problems.
"""


INSIGHTS_SCHEMA = {
    "type": "object",
    "required": ["headline", "observations", "risks", "recommendations"],
    "properties": {
        "headline": {"type": "string", "minLength": 10, "maxLength": 200},
        "observations": {
            "type": "array", "minItems": 1, "maxItems": 8,
            "items": {"type": "string", "maxLength": 300},
        },
        "risks": {
            "type": "array", "maxItems": 5,
            "items": {"type": "string", "maxLength": 300},
        },
        "recommendations": {
            "type": "array", "maxItems": 5,
            "items": {"type": "string", "maxLength": 300},
        },
    },
}


def _normalize_insights(data: dict) -> dict:
    if not isinstance(data, dict):
        return data
    def _as_list(v):
        if isinstance(v, list):
            return [str(x) for x in v if x]
        if isinstance(v, str) and v.strip():
            return [v.strip()]
        return []
    return {
        "headline": data.get("headline") or "Project summary unavailable.",
        "observations": _as_list(data.get("observations")) or ["No observations."],
        "risks": _as_list(data.get("risks")),
        "recommendations": _as_list(data.get("recommendations")),
    }


def generate_insights(*, user, project):
    """Compute stats in Django, then ask the AI to interpret them."""
    stats = project_analytics(project)

    by_assignee_lines = "\n".join(
        f"- {row['assignee__full_name'] or row['assignee__email']}: {row['count']} tasks"
        for row in stats.get("by_assignee", [])
    ) or "- (no assignees)"

    status_lines = "\n".join(
        f"- {status}: {count}"
        for status, count in stats.get("status_counts", {}).items()
    ) or "- (no tasks)"

    user_prompt = f"""Project: {project.name} ({project.key})
Total tasks: {stats['total_tasks']}
Overdue tasks: {stats['overdue_count']}

Status distribution:
{status_lines}

Tasks by assignee:
{by_assignee_lines}

Interpret these numbers. Highlight what stands out. Return JSON with keys:
headline, observations, risks, recommendations.
"""

    return call_ai(
        feature=AIInteraction.Feature.PROJECT_INSIGHTS,
        system_prompt=INSIGHTS_SYSTEM,
        user_prompt=user_prompt,
        schema=INSIGHTS_SCHEMA,
        user=user,
        workspace=project.workspace,
        normalizer=_normalize_insights,
    )
