from django.db import transaction

from .models import TaskActivity, TaskComment


@transaction.atomic
def create_comment(*, task, author, body):
    '''Create a comment, log activity, and notify the assignee.'''
    comment = TaskComment.objects.create(task=task, author=author, body=body)

    TaskActivity.objects.create(
        task=task,
        actor=author,
        verb=TaskActivity.Verb.COMMENTED,
    )

    _notify_assignee(task=task, author=author)
    return comment


def _notify_assignee(*, task, author):
    from apps.notifications.models import Notification
    from apps.workspaces.models import WorkspaceMember

    if task.assignee is None or task.assignee == author:
        return
    if not WorkspaceMember.objects.filter(
        workspace=task.project.workspace, user=task.assignee
    ).exists():
        return

    Notification.objects.create(
        recipient=task.assignee,
        actor=author,
        verb=Notification.Verb.TASK_COMMENTED,
        target_type='task',
        target_id=task.id,
        message=f'{author.display_name} commented on "{task.title}"',
    )
