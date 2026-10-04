from django.contrib import admin

from .models import Label, Milestone, Project, Task


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ["name", "workspace", "color"]
    list_filter = ["workspace"]
    search_fields = ["name"]


class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 0
    fields = ["title", "due_date", "is_completed"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["key", "name", "workspace", "status", "lead", "created_at"]
    list_filter = ["status", "workspace"]
    search_fields = ["name", "key"]
    autocomplete_fields = ["lead"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [MilestoneInline]


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ["title", "project", "due_date", "is_completed"]
    list_filter = ["is_completed"]
    search_fields = ["title", "project__name"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "project",
        "status",
        "priority",
        "assignee",
        "due_date",
        "position",
    ]
    list_filter = ["status", "priority", "project"]
    search_fields = ["title", "description"]
    autocomplete_fields = ["assignee", "created_by", "parent_task"]
    filter_horizontal = ["labels"]
    readonly_fields = ["created_at", "updated_at", "completed_at"]
