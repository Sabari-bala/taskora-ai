from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.projects.models import Label, Task
from apps.workspaces.models import WorkspaceMember

from .models import TaskActivity


class LabelMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id', 'name', 'color']


class TaskListSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    labels = LabelMiniSerializer(many=True, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'status', 'priority', 'position',
            'assignee', 'labels', 'due_date', 'estimate_hours',
            'is_overdue', 'created_at', 'updated_at',
        ]


class TaskDetailSerializer(TaskListSerializer):
    created_by = UserSerializer(read_only=True)
    subtask_count = serializers.SerializerMethodField()

    class Meta(TaskListSerializer.Meta):
        fields = TaskListSerializer.Meta.fields + [
            'description', 'project', 'created_by',
            'milestone', 'parent_task', 'completed_at', 'subtask_count',
        ]

    def get_subtask_count(self, obj):
        return obj.subtasks.count()


class TaskWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'status', 'priority',
            'assignee', 'milestone', 'labels',
            'due_date', 'estimate_hours', 'parent_task',
        ]

    def validate_assignee(self, value):
        if value is None:
            return value
        project = self.context.get('project')
        if project and not WorkspaceMember.objects.filter(
            workspace=project.workspace, user=value
        ).exists():
            raise serializers.ValidationError(
                'Assignee must be a member of the workspace.'
            )
        return value

    def validate_parent_task(self, value):
        if value is None:
            return value
        project = self.context.get('project')
        if project and value.project_id != project.id:
            raise serializers.ValidationError(
                'Parent task must be in the same project.'
            )
        return value


class TaskActivitySerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    human_readable = serializers.CharField(read_only=True)

    class Meta:
        model = TaskActivity
        fields = [
            'id', 'actor', 'verb', 'from_value', 'to_value',
            'human_readable', 'created_at',
        ]


class ReorderSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.Status.choices)
    position = serializers.IntegerField(min_value=0)
