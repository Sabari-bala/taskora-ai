from rest_framework import serializers


class PlanProjectRequestSerializer(serializers.Serializer):
    workspace_id = serializers.UUIDField()
    idea = serializers.CharField(min_length=20, max_length=2000)
    team_size = serializers.IntegerField(min_value=1, max_value=50, default=4)
    timeline = serializers.CharField(max_length=100, default="8 weeks")
    detail_level = serializers.ChoiceField(
        choices=["summary", "balanced", "deep"], default="balanced"
    )


class CommitMilestoneSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(
        max_length=600, required=False, allow_blank=True
    )
    due_date = serializers.DateField(required=False, allow_null=True)


class CommitTaskSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=250)
    description = serializers.CharField(
        max_length=800, required=False, allow_blank=True
    )
    epic = serializers.CharField(
        max_length=100, required=False, allow_blank=True
    )
    priority = serializers.ChoiceField(
        choices=["low", "medium", "high", "urgent"], default="medium"
    )
    estimated_hours = serializers.FloatField(
        required=False, allow_null=True, min_value=0
    )
    milestone_title = serializers.CharField(
        max_length=200, required=False, allow_blank=True
    )


class CommitPlanSerializer(serializers.Serializer):
    workspace_id = serializers.UUIDField()
    project_name = serializers.CharField(max_length=150)
    project_key = serializers.CharField(max_length=10)
    project_description = serializers.CharField(
        max_length=2000, required=False, allow_blank=True
    )
    milestones = CommitMilestoneSerializer(many=True, required=False, default=list)
    tasks = CommitTaskSerializer(many=True, min_length=1)

    def validate_project_key(self, value):
        value = value.upper().strip()
        if not value.isalnum():
            raise serializers.ValidationError("Key must be alphanumeric.")
        return value
