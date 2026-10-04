import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Workspace(models.Model):
    """
    Top-level tenancy boundary.
    Every project, task, and comment belongs to exactly one workspace.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, db_index=True)
    description = models.TextField(blank=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_workspaces",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workspaces_workspace"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._unique_slug()
        super().save(*args, **kwargs)

    def _unique_slug(self):
        base = slugify(self.name) or "workspace"
        slug = base
        counter = 1
        while Workspace.objects.filter(slug=slug).exists():
            counter += 1
            slug = f"{base}-{counter}"
        return slug


class WorkspaceMember(models.Model):
    """
    Join table between Workspace and User.
    Carries the `role` attribute, which is why this is a through-model
    and not a plain ManyToManyField.
    """

    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        MEMBER = "member", "Member"
        VIEWER = "viewer", "Viewer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER,
    )

    joined_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "workspaces_workspace_member"
        ordering = ["joined_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user"],
                name="unique_workspace_member",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "role"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user.email} | {self.workspace.name} | {self.role}"

    @property
    def is_admin_or_above(self):
        return self.role in {
            self.Role.OWNER,
            self.Role.ADMIN,
            self.Role.MANAGER,
        }

    @property
    def can_write(self):
        """Viewers cannot create or modify work."""
        return self.role != self.Role.VIEWER
