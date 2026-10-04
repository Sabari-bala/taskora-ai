from django.contrib import admin

from .models import AIInteraction


@admin.register(AIInteraction)
class AIInteractionAdmin(admin.ModelAdmin):
    list_display = [
        "feature",
        "status",
        "user",
        "provider",
        "total_tokens",
        "latency_ms",
        "created_at",
    ]
    list_filter = ["feature", "status", "provider"]
    search_fields = ["user__email", "error_message"]
    autocomplete_fields = ["user", "workspace"]
    readonly_fields = ["created_at"]
