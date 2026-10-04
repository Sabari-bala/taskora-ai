from django.db import transaction

from apps.projects.models import Task
from apps.workspaces.models import WorkspaceMember

from .models import TaskActivity


def _str(v):
    return '' if v is None else str(v)


@transaction.atomic
def create_task(*, project, actor, **data):
    data.pop('project', None)
    data.pop('created_by', None)
    task = Task.objects.create(project=project, created_by=actor, **data)
    TaskActivity.objects.create(
        task=task, actor=actor, verb=TaskActivity.Verb.CREATED,
    )
    return task


@transaction.atomic
def update_task(*, task, actor, **data):
    activities = []

    if 'status' in data and data['status'] != task.status:
        activities.append((
            TaskActivity.Verb.STATUS_CHANGED,
            _str(task.status),
            _str(data['status']),
        ))
    if 'priority' in data and data['priority'] != task.priority:
        activities.append((
            TaskActivity.Verb.PRIORITY_CHANGED,
            _str(task.priority),
            _str(data['priority']),
        ))
    if 'assignee' in data:
        old_id = task.assignee_id
        new_assignee = data['assignee']
        new_id = new_assignee.id if new_assignee else None
        if old_id != new_id:
            if new_id:
                activities.append((TaskActivity.Verb.ASSIGNED, '', ''))
            else:
                activities.append((TaskActivity.Verb.UNASSIGNED, '', ''))
    if 'due_date' in data and data['due_date'] != task.due_date:
        activities.append((
            TaskActivity.Verb.DUE_DATE_CHANGED,
            _str(task.due_date),
            _str(data['due_date']),
        ))

    for field, value in data.items():
        setattr(task, field, value)
    task.save()

    for verb, from_val, to_val in activities:
        TaskActivity.objects.create(
            task=task, actor=actor, verb=verb,
            from_value=from_val, to_value=to_val,
        )
    return task


@transaction.atomic
def reorder_task(*, task, actor, new_status, new_position):
    old_status = task.status
    task.status = new_status
    task.position = new_position
    task.save(update_fields=['status', 'position', 'completed_at', 'updated_at'])

    if old_status != new_status:
        TaskActivity.objects.create(
            task=task, actor=actor,
            verb=TaskActivity.Verb.STATUS_CHANGED,
            from_value=old_status, to_value=new_status,
        )
        _notify_status_change(task=task, actor=actor, new_status=new_status)
    return task


def _notify_status_change(*, task, actor, new_status):
    from apps.notifications.models import Notification
    if task.assignee is None or task.assignee == actor:
        return
    if not WorkspaceMember.objects.filter(
        workspace=task.project.workspace, user=task.assignee
    ).exists():
        return
    Notification.objects.create(
        recipient=task.assignee, actor=actor,
        verb=Notification.Verb.TASK_STATUS_CHANGED,
        target_type='task', target_id=task.id,
        message=f'{actor.display_name} moved "{task.title}" to {new_status}',
    )


def next_position(*, project, status):
    last = (
        Task.objects
        .filter(project=project, status=status)
        .order_by('-position')
        .first()
    )
    return (last.position + 1) if last else 0
