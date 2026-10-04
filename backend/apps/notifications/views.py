from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@extend_schema(tags=['notifications'])
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    '''Read-only list of the current user's notifications.'''

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        qs = (
            Notification.objects
            .filter(recipient=self.request.user)
            .select_related('actor')
        )
        if self.request.query_params.get('unread') == 'true':
            qs = qs.filter(is_read=False)
        return qs

    @extend_schema(request=None, responses=NotificationSerializer)
    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, id=None):
        '''POST /api/v1/notifications/<id>/read/'''
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)

    @extend_schema(request=None, responses={200: None})
    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        '''POST /api/v1/notifications/read-all/'''
        updated = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response(
            {'updated': updated},
            status=status.HTTP_200_OK,
        )

    @extend_schema(responses={200: None})
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        '''GET /api/v1/notifications/unread-count/'''
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})
