from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from .models import Project, Task


@transaction.atomic
def create_project(*, workspace, name, key, **kwargs):
    key = key.upper().strip()
    if Project.objects.filter(workspace=workspace, key=key).exists():
        raise ValueError(f'Project key already in use in this workspace.')
    return Project.objects.create(
        workspace=workspace, name=name, key=key, **kwargs,
    )


def board_data(project):
    tasks = (
        Task.objects.filter(project=project, parent_task__isnull=True)
        .select_related('assignee', 'created_by')
        .prefetch_related('labels')
        .order_by('status', 'position', '-created_at')
    )
    columns = {status: [] for status, _ in Task.Status.choices}
    for task in tasks:
        columns[task.status].append(task)
    return columns


def project_analytics(project):
    tasks = Task.objects.filter(project=project)
    total = tasks.count()
    status_counts = dict(
        tasks.values_list('status')
        .annotate(count=Count('id'))
        .values_list('status', 'count')
    )
    today = timezone.now().date()
    overdue = tasks.filter(
        due_date__lt=today
    ).exclude(status=Task.Status.DONE).count()
    by_assignee = list(
        tasks.exclude(assignee__isnull=True)
        .values('assignee__email', 'assignee__full_name')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    return {
        'total_tasks': total,
        'status_counts': status_counts,
        'overdue_count': overdue,
        'by_assignee': by_assignee,
    }
