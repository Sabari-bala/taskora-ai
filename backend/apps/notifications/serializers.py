from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'actor', 'verb', 'target_type', 'target_id',
            'message', 'is_read', 'created_at',
        ]
        read_only_fields = [
            'id', 'actor', 'verb', 'target_type', 'target_id',
            'message', 'created_at',
        ]
