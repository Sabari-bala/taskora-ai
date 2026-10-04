from apps.analytics.services import dashboard_summary
from apps.projects.models import Task
from apps.projects.services import project_analytics

from .models import AIInteraction
from .prompts import summarization, task_breakdown
from .schemas import TASK_BREAKDOWN_SCHEMA, TASK_SUMMARY_SCHEMA
from .services import call_ai


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
    )


def summarize_task(*, user, task):
    """Summarize comments + activity into decisions, blockers, next actions."""
    comments = list(
        task.comments.select_related("author").values(
            "body", author_name=models_F("author__full_name")
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


def generate_insights(*, user, project):
    """
    Compute stats in Django, then ask the AI to interpret them.
    The AI never sees the DB — only the structured summary we feed it.
    """
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
    )


# Late import to avoid circular
from django.db.models import F as models_F  # noqa: E402
