from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["recipient", "actor", "verb", "is_read", "created_at"]
    list_filter = ["is_read", "verb"]
    search_fields = ["recipient__email", "actor__email", "message"]
    autocomplete_fields = ["recipient", "actor"]
    readonly_fields = ["created_at"]
