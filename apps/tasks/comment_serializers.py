from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import TaskComment


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'author', 'body', 'created_at', 'edited_at']
        read_only_fields = ['id', 'author', 'created_at', 'edited_at']
