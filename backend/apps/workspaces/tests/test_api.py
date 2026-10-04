
'''Tests for workspaces API endpoints.'''
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.workspaces.models import Workspace, WorkspaceMember


pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def owner():
    return User.objects.create_user(
        email='owner@example.com', password='StrongPass!2026', full_name='Owner'
    )


@pytest.fixture
def admin():
    return User.objects.create_user(
        email='admin@example.com', password='StrongPass!2026', full_name='Admin'
    )


@pytest.fixture
def member():
    return User.objects.create_user(
        email='member@example.com', password='StrongPass!2026', full_name='Member'
    )


@pytest.fixture
def outsider():
    return User.objects.create_user(
        email='outsider@example.com', password='StrongPass!2026', full_name='Outsider'
    )


@pytest.fixture
def auth_api(api, owner):
    from rest_framework_simplejwt.tokens import RefreshToken

    access = str(RefreshToken.for_user(owner).access_token)
    api.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
    return api


@pytest.fixture
def workspace(owner):
    from apps.workspaces.services import create_workspace

    return create_workspace(owner=owner, name='Taskora HQ')


class TestWorkspaceCreateAndList:

    def test_create_workspace_requires_auth(self, api):
        response = api.post('/api/v1/workspaces/', {'name': 'X'}, format='json')
        assert response.status_code == 401

    def test_create_workspace_makes_creator_owner(self, auth_api, owner):
        response = auth_api.post(
            '/api/v1/workspaces/',
            {'name': 'My Team', 'description': 'Test'},
            format='json',
        )
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'My Team'
        assert data['slug'] == 'my-team'
        assert data['my_role'] == 'owner'
        assert data['member_count'] == 1

        ws = Workspace.objects.get(id=data['id'])
        assert ws.owner == owner
        assert WorkspaceMember.objects.filter(
            workspace=ws, user=owner, role=WorkspaceMember.Role.OWNER
        ).exists()

    def test_list_only_shows_user_workspaces(self, auth_api, owner, outsider):
        from apps.workspaces.services import create_workspace

        create_workspace(owner=owner, name='Mine')
        create_workspace(owner=outsider, name='Theirs')

        response = auth_api.get('/api/v1/workspaces/')
        assert response.status_code == 200
        data = response.json()
        names = [w['name'] for w in data['results']]
        assert 'Mine' in names
        assert 'Theirs' not in names


class TestWorkspaceUpdate:

    def test_owner_can_update_workspace(self, auth_api, workspace):
        response = auth_api.patch(
            f'/api/v1/workspaces/{workspace.id}/',
            {'name': 'Updated Name'},
            format='json',
        )
        assert response.status_code == 200
        assert response.json()['name'] == 'Updated Name'

    def test_non_member_cannot_update_workspace(self, api, workspace, outsider):
        from rest_framework_simplejwt.tokens import RefreshToken

        access = str(RefreshToken.for_user(outsider).access_token)
        api.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = api.patch(
            f'/api/v1/workspaces/{workspace.id}/',
            {'name': 'Hacked'},
            format='json',
        )
        assert response.status_code == 404


class TestMemberList:

    def test_list_members_includes_owner(self, auth_api, workspace):
        response = auth_api.get(f'/api/v1/workspaces/{workspace.id}/members/')
        assert response.status_code == 200
        members = response.json()
        assert len(members) == 1
        assert members[0]['role'] == 'owner'
        assert members[0]['user']['email'] == 'owner@example.com'

    def test_non_member_cannot_list(self, api, workspace, outsider):
        from rest_framework_simplejwt.tokens import RefreshToken

        access = str(RefreshToken.for_user(outsider).access_token)
        api.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = api.get(f'/api/v1/workspaces/{workspace.id}/members/')
        assert response.status_code == 403


class TestInviteMember:

    def test_owner_can_invite_existing_user(self, auth_api, workspace, member):
        response = auth_api.post(
            f'/api/v1/workspaces/{workspace.id}/members/',
            {'email': 'member@example.com', 'role': 'member'},
            format='json',
        )
        assert response.status_code == 201
        assert WorkspaceMember.objects.filter(
            workspace=workspace, user=member
        ).exists()
        # Notification was created
        assert Notification.objects.filter(
            recipient=member, verb=Notification.Verb.WORKSPACE_INVITE
        ).exists()

    def test_invite_unknown_email_fails(self, auth_api, workspace):
        response = auth_api.post(
            f'/api/v1/workspaces/{workspace.id}/members/',
            {'email': 'nobody@example.com', 'role': 'member'},
            format='json',
        )
        assert response.status_code == 400

    def test_invite_existing_member_fails(self, auth_api, workspace, member):
        WorkspaceMember.objects.create(workspace=workspace, user=member)
        response = auth_api.post(
            f'/api/v1/workspaces/{workspace.id}/members/',
            {'email': 'member@example.com', 'role': 'member'},
            format='json',
        )
        assert response.status_code == 400

    def test_cannot_invite_as_owner(self, auth_api, workspace, member):
        response = auth_api.post(
            f'/api/v1/workspaces/{workspace.id}/members/',
            {'email': 'member@example.com', 'role': 'owner'},
            format='json',
        )
        assert response.status_code == 400

    def test_member_cannot_invite(self, api, workspace, member, outsider):
        from rest_framework_simplejwt.tokens import RefreshToken

        WorkspaceMember.objects.create(workspace=workspace, user=member)
        access = str(RefreshToken.for_user(member).access_token)
        api.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = api.post(
            f'/api/v1/workspaces/{workspace.id}/members/',
            {'email': 'outsider@example.com', 'role': 'member'},
            format='json',
        )
        assert response.status_code == 403


class TestChangeRole:

    def test_owner_can_promote_member_to_admin(self, auth_api, workspace, member):
        m = WorkspaceMember.objects.create(workspace=workspace, user=member)
        response = auth_api.patch(
            f'/api/v1/workspaces/{workspace.id}/members/{m.id}/',
            {'role': 'admin'},
            format='json',
        )
        assert response.status_code == 200
        m.refresh_from_db()
        assert m.role == 'admin'

    def test_cannot_change_owner_role(self, auth_api, workspace, owner):
        owner_member = WorkspaceMember.objects.get(
            workspace=workspace, user=owner
        )
        response = auth_api.patch(
            f'/api/v1/workspaces/{workspace.id}/members/{owner_member.id}/',
            {'role': 'admin'},
            format='json',
        )
        assert response.status_code == 400

    def test_cannot_promote_to_owner(self, auth_api, workspace, member):
        m = WorkspaceMember.objects.create(workspace=workspace, user=member)
        response = auth_api.patch(
            f'/api/v1/workspaces/{workspace.id}/members/{m.id}/',
            {'role': 'owner'},
            format='json',
        )
        assert response.status_code == 400


class TestRemoveMember:

    def test_owner_can_remove_member(self, auth_api, workspace, member):
        m = WorkspaceMember.objects.create(workspace=workspace, user=member)
        response = auth_api.delete(
            f'/api/v1/workspaces/{workspace.id}/members/{m.id}/'
        )
        assert response.status_code == 204
        assert not WorkspaceMember.objects.filter(id=m.id).exists()

    def test_cannot_remove_owner(self, auth_api, workspace, owner):
        owner_member = WorkspaceMember.objects.get(
            workspace=workspace, user=owner
        )
        response = auth_api.delete(
            f'/api/v1/workspaces/{workspace.id}/members/{owner_member.id}/'
        )
        assert response.status_code == 400

    def test_member_cannot_remove_others(
        self, api, workspace, member, outsider
    ):
        from rest_framework_simplejwt.tokens import RefreshToken

        m1 = WorkspaceMember.objects.create(workspace=workspace, user=member)
        m2 = WorkspaceMember.objects.create(workspace=workspace, user=outsider)
        access = str(RefreshToken.for_user(member).access_token)
        api.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = api.delete(
            f'/api/v1/workspaces/{workspace.id}/members/{m2.id}/'
        )
        assert response.status_code == 403
