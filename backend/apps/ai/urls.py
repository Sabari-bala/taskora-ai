from django.urls import path

from .planner_views import PlanProjectCommitView, PlanProjectView

app_name = "ai"

urlpatterns = [
    path(
        "ai/plan-project/",
        PlanProjectView.as_view(),
        name="plan-project",
    ),
    path(
        "ai/plan-project/commit/",
        PlanProjectCommitView.as_view(),
        name="plan-project-commit",
    ),
]
