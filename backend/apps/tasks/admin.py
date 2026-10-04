from django.contrib import admin

from .models import TaskActivity, TaskComment


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ["task", "author", "created_at", "edited_at"]
    search_fields = ["body", "author__email"]
    autocomplete_fields = ["author"]
    readonly_fields = ["created_at", "edited_at"]


@admin.register(TaskActivity)
class TaskActivityAdmin(admin.ModelAdmin):
    list_display = ["task", "actor", "verb", "from_value", "to_value", "created_at"]
    list_filter = ["verb"]
    search_fields = ["task__title", "actor__email"]
    autocomplete_fields = ["actor"]
    readonly_fields = ["created_at"]
