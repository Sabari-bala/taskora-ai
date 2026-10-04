
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    WorkspaceMemberDetailView,
    WorkspaceMemberListView,
    WorkspaceViewSet,
)

app_name = "workspaces"

router = DefaultRouter()
router.register("workspaces", WorkspaceViewSet, basename="workspace")

urlpatterns = router.urls + [
    path(
        "workspaces/<uuid:workspace_id>/members/",
        WorkspaceMemberListView.as_view(),
        name="member-list",
    ),
    path(
        "workspaces/<uuid:workspace_id>/members/<uuid:member_id>/",
        WorkspaceMemberDetailView.as_view(),
        name="member-detail",
    ),
]
