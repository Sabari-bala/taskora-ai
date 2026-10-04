from django.db import transaction

from apps.projects.models import Label, Milestone
from apps.projects.services import create_project
from apps.tasks.services import create_task

from .models import AIInteraction
from .prompts import planner as planner_prompt
from .schemas import PROJECT_PLAN_SCHEMA
from .services import call_ai


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

    # Map milestone titles to objects so tasks can attach to them
    milestone_by_title = {}
    for m in milestones:
        obj = Milestone.objects.create(
            project=project,
            title=m["title"],
            description=m.get("description", ""),
            due_date=m.get("due_date"),
        )
        milestone_by_title[m["title"]] = obj

    # Epics become workspace labels (reused across projects in this workspace)
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
