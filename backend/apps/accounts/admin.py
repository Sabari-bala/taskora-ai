from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import EmailChangeRequest, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "full_name", "is_staff", "is_active", "date_joined"]
    list_filter = ["is_staff", "is_active", "is_superuser"]
    search_fields = ["email", "full_name"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "avatar")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "password1", "password2"),
            },
        ),
    )


@admin.register(EmailChangeRequest)
class EmailChangeRequestAdmin(admin.ModelAdmin):
    list_display = ["user", "new_email", "code", "expires_at", "used_at", "created_at"]
    list_filter = ["used_at"]
    search_fields = ["user__email", "new_email", "code"]
    autocomplete_fields = ["user"]
    readonly_fields = ["created_at", "code", "expires_at"]
