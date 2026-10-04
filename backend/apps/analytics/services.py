from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from apps.projects.models import Project, Task
from apps.tasks.models import TaskActivity
from apps.workspaces.models import Workspace


def dashboard_summary(user):
    '''
    Real numbers for the dashboard header — computed from the DB.
    No fabricated data. Every number is a query result.
    '''
    workspaces = Workspace.objects.filter(memberships__user=user)
    projects = Project.objects.filter(
        workspace__in=workspaces, status=Project.Status.ACTIVE
    )
    tasks = Task.objects.filter(project__in=projects)

    today = timezone.now().date()
    week_ago = timezone.now() - timedelta(days=7)

    return {
        'workspace_count': workspaces.distinct().count(),
        'active_projects': projects.distinct().count(),
        'total_tasks': tasks.count(),
        'completed_tasks': tasks.filter(status=Task.Status.DONE).count(),
        'overdue_tasks': tasks.filter(
            due_date__lt=today
        ).exclude(status=Task.Status.DONE).count(),
        'assigned_to_me': Task.objects.filter(
            assignee=user,
        ).exclude(status=Task.Status.DONE).count(),
        'completed_this_week': tasks.filter(
            status=Task.Status.DONE,
            completed_at__gte=week_ago,
        ).count(),
    }


def recent_activity(user, limit=15):
    '''
    Recent task activity across all workspaces the user belongs to.
    '''
    return (
        TaskActivity.objects
        .filter(task__project__workspace__memberships__user=user)
        .select_related('actor', 'task', 'task__project')
        .order_by('-created_at')[:limit]
    )


def my_upcoming_tasks(user, limit=10):
    '''
    Tasks assigned to the current user, ordered by due date.
    Overdue items first, then by nearest due date.
    '''
    today = timezone.now().date()
    return (
        Task.objects
        .filter(assignee=user)
        .exclude(status=Task.Status.DONE)
        .select_related('project')
        .annotate(
            is_overdue_flag=Q(due_date__lt=today),
        )
        .order_by('-is_overdue_flag', 'due_date', '-priority')[:limit]
    )
