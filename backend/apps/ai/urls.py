from django.urls import path

from .assistant_views import (
    BreakdownTaskView,
    ProjectInsightsView,
    SummarizeTaskView,
)
from .planner_views import PlanProjectCommitView, PlanProjectView

app_name = "ai"

urlpatterns = [
    path("ai/plan-project/", PlanProjectView.as_view(), name="plan-project"),
    path(
        "ai/plan-project/commit/",
        PlanProjectCommitView.as_view(),
        name="plan-project-commit",
    ),
    path("ai/breakdown-task/", BreakdownTaskView.as_view(), name="breakdown-task"),
    path("ai/summarize-task/", SummarizeTaskView.as_view(), name="summarize-task"),
    path("ai/project-insights/", ProjectInsightsView.as_view(), name="project-insights"),
]
