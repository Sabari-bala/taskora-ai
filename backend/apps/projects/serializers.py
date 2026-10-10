from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Label, Milestone, Project


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id', 'name', 'color', 'workspace', 'created_at']
        read_only_fields = ['id', 'workspace', 'created_at']


class MilestoneSerializer(serializers.ModelSerializer):
    project = serializers.UUIDField(read_only=True)

    class Meta:
        model = Milestone
        fields = [
            'id', 'project', 'title', 'description',
            'due_date', 'is_completed', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'project', 'created_at', 'updated_at']


class ProjectListSerializer(serializers.ModelSerializer):
    lead = UserSerializer(read_only=True)
    task_count = serializers.IntegerField(read_only=True, default=0)
    completed_task_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'key', 'description', 'status',
            'lead', 'start_date', 'due_date',
            'task_count', 'completed_task_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectDetailSerializer(ProjectListSerializer):
    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields


class ProjectWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'name', 'key', 'description', 'status',
            'lead', 'start_date', 'due_date',
        ]

    def validate_key(self, value):
        value = value.upper().strip()
        if not value.isalnum():
            raise serializers.ValidationError('Key must be alphanumeric.')
        if len(value) > 10:
            raise serializers.ValidationError('Key must be 10 characters or fewer.')
        return value

    def validate(self, attrs):
        start = attrs.get('start_date')
        due = attrs.get('due_date')
        if start and due and start > due:
            raise serializers.ValidationError(
                {'due_date': 'Due date must be after start date.'}
            )
        return attrs
