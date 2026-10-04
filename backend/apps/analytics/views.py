from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import DashboardSummarySerializer
from .services import dashboard_summary, my_upcoming_tasks, recent_activity


@extend_schema(tags=['analytics'])
class DashboardSummaryView(APIView):
    '''GET /api/v1/dashboard/summary/'''

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=DashboardSummarySerializer)
    def get(self, request):
        data = dashboard_summary(request.user)
        return Response(data)


@extend_schema(tags=['analytics'])
class DashboardActivityView(APIView):
    '''GET /api/v1/dashboard/activity/'''

    permission_classes = [IsAuthenticated]

    def get(self, request):
        activities = recent_activity(request.user)
        from apps.tasks.serializers import TaskActivitySerializer

        return Response(TaskActivitySerializer(activities, many=True).data)


@extend_schema(tags=['analytics'])
class DashboardMyTasksView(APIView):
    '''GET /api/v1/dashboard/my-tasks/'''

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = my_upcoming_tasks(request.user)
        from apps.tasks.serializers import TaskListSerializer

        return Response(TaskListSerializer(tasks, many=True).data)
