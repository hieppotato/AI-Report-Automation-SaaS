from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest

from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError
from app.schemas.invitation import InvitationCreate
from app.services.invitation_service import InvitationService

ORG_ID = uuid4()
USER_ID = uuid4()
OTHER_USER_ID = uuid4()
NOW = datetime.now(tz=timezone.utc)


def make_invitation(
    status="pending",
    email="user@example.com",
    role="member",
    invited_user_exists=False,
    days_offset=7,
):
    return {
        "id": str(uuid4()),
        "organization_id": str(ORG_ID),
        "email": email,
        "role": role,
        "token": "test-token-abc123",
        "status": status,
        "invited_user_exists": invited_user_exists,
        "expires_at": (NOW + timedelta(days=days_offset)).isoformat(),
        "created_at": NOW.isoformat(),
    }


class FakeInvitationRepo:
    def __init__(self):
        self.invitations = []
        self.next_token_index = 0

    def create_invitation(self, data):
        inv = dict(data)
        inv["id"] = str(uuid4())
        inv["created_at"] = NOW.isoformat()
        self.invitations.append(inv)
        return inv

    def list_invitations(self, org_id, limit, offset):
        items = [i for i in self.invitations if i["organization_id"] == str(org_id)]
        return items, len(items)

    def get_by_id(self, org_id, inv_id):
        for i in self.invitations:
            if i["id"] == str(inv_id) and i["organization_id"] == str(org_id):
                return i
        return None

    def get_by_token(self, token):
        for i in self.invitations:
            if i["token"] == token:
                return i
        return None

    def update_status(self, inv_id, status):
        for i in self.invitations:
            if i["id"] == str(inv_id):
                i["status"] = status
                return i
        return None

    def delete_invitation(self, org_id, inv_id):
        for i in self.invitations:
            if i["id"] == str(inv_id) and i["organization_id"] == str(org_id):
                self.invitations.remove(i)
                return True
        return False


class FakeOrgRepo:
    def __init__(self):
        self.members = {}

    def get_by_id(self, org_id):
        return {"id": str(org_id), "name": "Test Org", "slug": "test-org"}

    def get_user_id_by_email(self, email):
        if email == "existing@example.com":
            return USER_ID
        return None

    def get_membership(self, org_id, user_id):
        return self.members.get(str(user_id))

    def list_members(self, org_id, limit=None, offset=0):
        return list(self.members.values()) if limit is None else (list(self.members.values()), len(self.members))

    def add_member(self, org_id, payload):
        member = {
            "id": str(uuid4()),
            "organization_id": str(org_id),
            "user_id": str(payload.user_id),
            "role": payload.role,
        }
        self.members[str(payload.user_id)] = member
        return member


class FakeEmailService:
    def __init__(self):
        self.sent = []

    def send_invitation_email(self, **kwargs):
        self.sent.append(kwargs)
        from app.services.email_service import EmailResult
        return EmailResult(success=True, message="Email sent.")


@pytest.fixture
def service():
    return InvitationService(FakeInvitationRepo(), FakeOrgRepo(), FakeEmailService())


def test_create_invitation_for_new_user(service):
    inv = service.create_invitation(ORG_ID, InvitationCreate(email="new@example.com", role="member"))
    assert inv["email"] == "new@example.com"
    assert inv["role"] == "member"
    assert inv["status"] == "pending"
    assert inv["invited_user_exists"] is False
    assert "accept_url" in inv
    assert len(service.email_service.sent) == 1
    assert service.email_service.sent[0]["is_new_user"] is True


def test_create_invitation_for_existing_user(service):
    inv = service.create_invitation(ORG_ID, InvitationCreate(email="existing@example.com", role="admin"))
    assert inv["invited_user_exists"] is True
    assert len(service.email_service.sent) == 1
    assert service.email_service.sent[0]["is_new_user"] is False


def test_duplicate_pending_invitation_raises_conflict(service):
    service.create_invitation(ORG_ID, InvitationCreate(email="dupe@example.com", role="member"))
    with pytest.raises(ConflictError):
        service.create_invitation(ORG_ID, InvitationCreate(email="dupe@example.com", role="admin"))


def test_inviting_existing_member_raises_conflict(service):
    service.organization_repo.members[str(USER_ID)] = {
        "id": str(uuid4()),
        "organization_id": str(ORG_ID),
        "user_id": str(USER_ID),
        "role": "member",
    }
    with pytest.raises(ConflictError):
        service.create_invitation(ORG_ID, InvitationCreate(email="existing@example.com", role="member"))


def test_accept_invitation_success(service):
    inv = service.create_invitation(ORG_ID, InvitationCreate(email="accept@example.com", role="member"))
    result = service.accept_invitation(inv["token"], uuid4(), "accept@example.com")
    assert result["status"] == "accepted"


def test_accept_invitation_expired(service):
    repo = FakeInvitationRepo()
    org_repo = FakeOrgRepo()
    email_svc = FakeEmailService()
    svc = InvitationService(repo, org_repo, email_svc)
    repo.invitations.append(make_invitation(days_offset=-1))
    with pytest.raises(PermissionDeniedError, match="has expired"):
        svc.accept_invitation("test-token-abc123", uuid4(), "user@example.com")


def test_accept_invitation_wrong_email(service):
    inv = service.create_invitation(ORG_ID, InvitationCreate(email="right@example.com", role="member"))
    with pytest.raises(PermissionDeniedError, match="does not match"):
        service.accept_invitation(inv["token"], uuid4(), "wrong@example.com")


def test_accept_invitation_already_accepted(service):
    inv = service.create_invitation(ORG_ID, InvitationCreate(email="done@example.com", role="member"))
    service.accept_invitation(inv["token"], uuid4(), "done@example.com")
    with pytest.raises(PermissionDeniedError, match="no longer pending"):
        service.accept_invitation(inv["token"], uuid4(), "done@example.com")


def test_delete_invitation(service):
    inv = service.create_invitation(ORG_ID, InvitationCreate(email="del@example.com", role="member"))
    service.delete_invitation(ORG_ID, UUID(inv["id"]))
    with pytest.raises(NotFoundError):
        service.delete_invitation(ORG_ID, UUID(inv["id"]))


def test_list_invitations_paginated(service):
    service.create_invitation(ORG_ID, InvitationCreate(email="a@example.com", role="member"))
    service.create_invitation(ORG_ID, InvitationCreate(email="b@example.com", role="admin"))
    from app.schemas.pagination import PaginationParams
    result = service.list_invitations(ORG_ID, PaginationParams(limit=10, offset=0))
    assert result.total == 2
    assert len(result.items) == 2


def test_resend_invitation(service):
    inv = service.create_invitation(ORG_ID, InvitationCreate(email="resend@example.com", role="member"))
    service.email_service.sent.clear()
    result = service.resend_invitation(ORG_ID, UUID(inv["id"]))
    assert result["email"] == "resend@example.com"
    assert len(service.email_service.sent) == 1


def test_resend_nonexistent_invitation_raises_not_found(service):
    with pytest.raises(NotFoundError):
        service.resend_invitation(ORG_ID, uuid4())
