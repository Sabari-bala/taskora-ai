from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import LabelViewSet, MilestoneViewSet, ProjectViewSet

app_name = 'projects'

router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='project')
router.register('labels', LabelViewSet, basename='label')

urlpatterns = router.urls + [
    path(
        'projects/<uuid:project_id>/milestones/',
        MilestoneViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='milestone-list',
    ),
    path(
        'projects/<uuid:project_id>/milestones/<uuid:id>/',
        MilestoneViewSet.as_view({
            'get': 'retrieve',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
        name='milestone-detail',
    ),
]
