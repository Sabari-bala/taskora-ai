from django.db import transaction

from apps.projects.models import Label, Milestone
from apps.projects.services import create_project
from apps.tasks.services import create_task

from .models import AIInteraction
from .prompts import planner as planner_prompt
from .schemas import PROJECT_PLAN_SCHEMA
from .services import call_ai


def _normalize_plan(data: dict) -> dict:
    """
    Normalize common LLM aliases into our canonical field names.

    Groq's gpt-oss-120b sometimes uses `name` instead of `title`, and
    `estimate_hours` instead of `estimated_hours`. Rather than fail the
    request, we map them here. This runs BEFORE schema validation.
    """
    if not isinstance(data, dict):
        return data

    milestones = []
    for m in data.get("milestones") or []:
        if isinstance(m, str):
            milestones.append({"title": m})
            continue
        if not isinstance(m, dict):
            continue
        milestones.append({
            "title": m.get("title") or m.get("name") or "",
            "description": m.get("description") or "",
            "suggested_week": m.get("suggested_week"),
        })
    # strip None values so schema defaults / optional checks work
    for m in milestones:
        if m.get("suggested_week") is None:
            m.pop("suggested_week", None)
        if not m.get("description"):
            m.pop("description", None)

    epics = []
    for e in data.get("epics") or []:
        if isinstance(e, str):
            epics.append({"name": e})
            continue
        if not isinstance(e, dict):
            continue
        epics.append({
            "name": e.get("name") or e.get("title") or "",
            "description": e.get("description") or "",
        })
    for e in epics:
        if not e.get("description"):
            e.pop("description", None)

    tasks = []
    for t in data.get("tasks") or []:
        if not isinstance(t, dict):
            continue
        hours = t.get("estimated_hours")
        if hours is None:
            hours = t.get("estimate_hours")
        if hours is None:
            hours = t.get("estimate")
        priority = (t.get("priority") or "medium").lower()
        if priority not in ("low", "medium", "high", "urgent"):
            priority = "medium"

        task = {
            "title": t.get("title") or t.get("name") or "",
            "priority": priority,
        }
        if t.get("description"):
            task["description"] = t["description"]
        if t.get("epic"):
            task["epic"] = t["epic"]
        if hours is not None:
            task["estimated_hours"] = hours
        if t.get("milestone_title"):
            task["milestone_title"] = t["milestone_title"]
        tasks.append(task)

    return {
        "overview": data.get("overview") or "No overview provided.",
        "milestones": milestones,
        "epics": epics,
        "tasks": tasks,
    }


def generate_plan(*, user, workspace, idea, team_size, timeline, detail_level):
    """
    Produce a project plan proposal.
    Writes NOTHING to the database — this is a pure read.
    """
    user_prompt = planner_prompt.build_user_prompt(
        idea=idea,
        team_size=team_size,
        timeline=timeline,
        detail_level=detail_level,
    )
    return call_ai(
        feature=AIInteraction.Feature.PLAN_PROJECT,
        system_prompt=planner_prompt.SYSTEM,
        user_prompt=user_prompt,
        schema=PROJECT_PLAN_SCHEMA,
        user=user,
        workspace=workspace,
        normalizer=_normalize_plan,
    )


@transaction.atomic
def commit_plan(
    *,
    user,
    workspace,
    project_name,
    project_key,
    project_description,
    milestones,
    tasks,
):
    """
    Persist the accepted subset of a plan.

    Uses the same create_project / create_task services as manual creation,
    so all normal business rules apply. If any step fails, the whole
    transaction rolls back — no partial projects.
    """
    project = create_project(
        workspace=workspace,
        name=project_name,
        key=project_key,
        description=project_description or "",
        lead=user,
    )

    milestone_by_title = {}
    for m in milestones:
        obj = Milestone.objects.create(
            project=project,
            title=m["title"],
            description=m.get("description", ""),
            due_date=m.get("due_date"),
        )
        milestone_by_title[m["title"]] = obj

    label_by_name = {}
    for t in tasks:
        epic = (t.get("epic") or "").strip()
        if epic and epic not in label_by_name:
            label, _ = Label.objects.get_or_create(
                workspace=workspace,
                name=epic,
                defaults={"color": "#4F5EE8"},
            )
            label_by_name[epic] = label

    created_tasks = []
    for t in tasks:
        milestone = None
        if t.get("milestone_title"):
            milestone = milestone_by_title.get(t["milestone_title"])

        task = create_task(
            project=project,
            actor=user,
            title=t["title"],
            description=t.get("description", ""),
            priority=t.get("priority", "medium"),
            milestone=milestone,
            estimate_hours=t.get("estimated_hours"),
        )
        epic = (t.get("epic") or "").strip()
        if epic and epic in label_by_name:
            task.labels.add(label_by_name[epic])
        created_tasks.append(task)

    return {
        "project_id": str(project.id),
        "project_name": project.name,
        "project_key": project.key,
        "milestones_created": len(milestones),
        "tasks_created": len(created_tasks),
        "labels_created": len(label_by_name),
    }
