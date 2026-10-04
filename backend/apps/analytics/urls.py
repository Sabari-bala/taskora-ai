from django.urls import path

from .views import (
    DashboardActivityView,
    DashboardMyTasksView,
    DashboardSummaryView,
)

app_name = 'analytics'

urlpatterns = [
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='summary'),
    path('dashboard/activity/', DashboardActivityView.as_view(), name='activity'),
    path('dashboard/my-tasks/', DashboardMyTasksView.as_view(), name='my-tasks'),
]
