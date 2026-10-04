import uuid

from django.conf import settings
from django.db import models


class TaskComment(models.Model):
    """
    A comment on a task. Editable by its author.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    task = models.ForeignKey(
        "projects.Task",
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="task_comments",
    )

    body = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tasks_task_comment"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["task", "created_at"]),
        ]

    def __str__(self):
        return f"Comment by {self.author} on {self.task_id}"


class TaskActivity(models.Model):
    """
    Immutable audit log. Every meaningful change to a task writes one row.
    Powers the activity timeline in the task detail drawer.
    """

    class Verb(models.TextChoices):
        CREATED = "created", "Created"
        STATUS_CHANGED = "status_changed", "Status changed"
        PRIORITY_CHANGED = "priority_changed", "Priority changed"
        ASSIGNED = "assigned", "Assigned"
        UNASSIGNED = "unassigned", "Unassigned"
        DUE_DATE_CHANGED = "due_date_changed", "Due date changed"
        COMMENTED = "commented", "Commented"
        LABEL_ADDED = "label_added", "Label added"
        LABEL_REMOVED = "label_removed", "Label removed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    task = models.ForeignKey(
        "projects.Task",
        on_delete=models.CASCADE,
        related_name="activities",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="task_activities",
    )

    verb = models.CharField(max_length=30, choices=Verb.choices)
    from_value = models.CharField(max_length=255, blank=True)
    to_value = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tasks_task_activity"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["task", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.actor} {self.verb} {self.task_id}"

    @property
    def human_readable(self):
        """Turn a row into a sentence for the UI timeline."""
        actor_name = self.actor.display_name if self.actor else "Someone"
        if self.verb == self.Verb.CREATED:
            return f"{actor_name} created the task"
        if self.verb == self.Verb.STATUS_CHANGED:
            return f"{actor_name} moved status from {self.from_value} to {self.to_value}"
        if self.verb == self.Verb.PRIORITY_CHANGED:
            return f"{actor_name} changed priority from {self.from_value} to {self.to_value}"
        if self.verb == self.Verb.ASSIGNED:
            return f"{actor_name} assigned the task"
        if self.verb == self.Verb.UNASSIGNED:
            return f"{actor_name} unassigned the task"
        if self.verb == self.Verb.DUE_DATE_CHANGED:
            return f"{actor_name} changed the due date"
        if self.verb == self.Verb.COMMENTED:
            return f"{actor_name} commented"
        if self.verb == self.Verb.LABEL_ADDED:
            return f"{actor_name} added label {self.to_value}"
        if self.verb == self.Verb.LABEL_REMOVED:
            return f"{actor_name} removed label {self.to_value}"
        return f"{actor_name} performed {self.verb}"
