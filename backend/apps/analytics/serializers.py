from rest_framework import serializers


class DashboardSummarySerializer(serializers.Serializer):
    workspace_count = serializers.IntegerField()
    active_projects = serializers.IntegerField()
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    overdue_tasks = serializers.IntegerField()
    assigned_to_me = serializers.IntegerField()
    completed_this_week = serializers.IntegerField()
