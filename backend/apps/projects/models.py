import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Label(models.Model):
    """
    A tag scoped to a workspace. Reused across all projects in that workspace.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="labels",
    )
    name = models.CharField(max_length=50)
    color = models.CharField(
        max_length=7,
        default="#4F5EE8",
        help_text="Hex colour code, e.g. #4F5EE8",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "projects_label"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                name="unique_label_per_workspace",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.workspace.slug})"


class Project(models.Model):
    """
    A project inside a workspace. Groups tasks and milestones.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ON_HOLD = "on_hold", "On Hold"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=150)
    key = models.CharField(
        max_length=10,
        help_text="Short uppercase identifier used in task IDs, e.g. TASK.",
    )
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="led_projects",
    )

    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects_project"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "key"],
                name="unique_project_key_per_workspace",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "status"]),
        ]

    def __str__(self):
        return f"{self.key} - {self.name}"

    def save(self, *args, **kwargs):
        if self.key:
            self.key = self.key.upper()
        super().save(*args, **kwargs)


class Milestone(models.Model):
    """
    A checkpoint inside a project with an optional due date.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="milestones",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects_milestone"
        ordering = ["due_date", "created_at"]
        indexes = [
            models.Index(fields=["project", "is_completed"]),
        ]

    def __str__(self):
        return self.title


class Task(models.Model):
    """
    The core work item. Belongs to a project.
    Designed for Kanban boards via `status` + `position`.
    """

    class Status(models.TextChoices):
        BACKLOG = "backlog", "Backlog"
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        REVIEW = "review", "Review"
        DONE = "done", "Done"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tasks",
    )

    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.BACKLOG,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tasks",
    )

    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    labels = models.ManyToManyField(
        Label,
        blank=True,
        related_name="tasks",
    )

    parent_task = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subtasks",
    )

    due_date = models.DateField(null=True, blank=True)
    estimate_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )

    position = models.PositiveIntegerField(
        default=0,
        help_text="Order within its Kanban column.",
    )

    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects_task"
        ordering = ["status", "position", "-created_at"]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["assignee", "status"]),
            models.Index(fields=["project", "position"]),
            models.Index(fields=["due_date"]),
        ]

    def __str__(self):
        return f"{self.project.key}-{str(self.id)[:8]} {self.title}"

    def save(self, *args, **kwargs):
        # Auto-set completed_at when status becomes DONE
        if self.status == self.Status.DONE and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != self.Status.DONE and self.completed_at:
            self.completed_at = None
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        if not self.due_date or self.status == self.Status.DONE:
            return False
        return self.due_date < timezone.now().date()

    @property
    def is_subtask(self):
        return self.parent_task_id is not None
