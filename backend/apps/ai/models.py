import uuid

from django.conf import settings
from django.db import models


class AIInteraction(models.Model):
    """Audit log for every AI request."""

    class Feature(models.TextChoices):
        PLAN_PROJECT = "plan_project", "Plan project"
        BREAKDOWN_TASK = "breakdown_task", "Breakdown task"
        SUMMARIZE_TASK = "summarize_task", "Summarize task"
        PROJECT_INSIGHTS = "project_insights", "Project insights"

    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        VALIDATION_ERROR = "validation_error", "Validation error"
        TIMEOUT = "timeout", "Timeout"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ai_interactions",
    )
    workspace = models.ForeignKey(
        "workspaces.Workspace",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_interactions",
    )

    feature = models.CharField(max_length=30, choices=Feature.choices)
    status = models.CharField(max_length=30, choices=Status.choices)
    provider = models.CharField(max_length=30, blank=True)
    model_name = models.CharField(max_length=60, blank=True)

    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    latency_ms = models.PositiveIntegerField(default=0)

    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_ai_interaction"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["feature", "status"]),
        ]

    def __str__(self):
        return f"{self.feature} | {self.status} | {self.user_id}"

    @property
    def total_tokens(self):
        return self.prompt_tokens + self.completion_tokens
