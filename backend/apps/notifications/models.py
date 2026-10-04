import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    """In-app notification. Delivered to a single recipient."""

    class Verb(models.TextChoices):
        TASK_ASSIGNED = "task_assigned", "Task assigned"
        TASK_STATUS_CHANGED = "task_status_changed", "Task status changed"
        TASK_COMMENTED = "task_commented", "New comment on task"
        DUE_DATE_APPROACHING = "due_date_approaching", "Due date approaching"
        WORKSPACE_INVITE = "workspace_invite", "Invited to workspace"
        MEMBER_ROLE_CHANGED = "member_role_changed", "Your role changed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_notifications",
    )

    verb = models.CharField(max_length=40, choices=Verb.choices)

    target_type = models.CharField(max_length=50, blank=True)
    target_id = models.UUIDField(null=True, blank=True)

    message = models.CharField(max_length=255, blank=True)

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "-created_at"]),
        ]

    def __str__(self):
        return f"[{'read' if self.is_read else 'unread'}] {self.recipient} - {self.verb}"
