from rest_framework import serializers


class BreakdownTaskRequestSerializer(serializers.Serializer):
    task_id = serializers.UUIDField()


class SummarizeTaskRequestSerializer(serializers.Serializer):
    task_id = serializers.UUIDField()


class CommitBreakdownSerializer(serializers.Serializer):
    """Payload for creating accepted subtasks."""

    parent_task_id = serializers.UUIDField()
    subtasks = serializers.ListField(
        min_length=1,
        max_length=15,
        child=serializers.DictField(),
    )
