from django.urls import path
from rest_framework.routers import DefaultRouter

from .comment_views import TaskCommentViewSet
from .views import TaskViewSet

app_name = 'tasks'

router = DefaultRouter()
router.register('tasks', TaskViewSet, basename='task')

urlpatterns = router.urls + [
    path(
        'tasks/<uuid:task_id>/comments/',
        TaskCommentViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='comment-list',
    ),
    path(
        'tasks/<uuid:task_id>/comments/<uuid:id>/',
        TaskCommentViewSet.as_view({
            'get': 'retrieve',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
        name='comment-detail',
    ),
]
