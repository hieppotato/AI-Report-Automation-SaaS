from uuid import UUID, uuid4

import pytest

from app.core.exceptions import NotFoundError
from app.schemas.organization import AddOrganizationMemberRequest
from app.services.organization_service import OrganizationService


ORG_ID = uuid4()
USER_ID = uuid4()


class EmailLookupRepo:
    def __init__(self, found_user_id=USER_ID) -> None:
        self.found_user_id = found_user_id
        self.added_payload = None

    def get_by_id(self, organization_id):
        return {"id": str(organization_id)}

    def get_user_id_by_email(self, email):
        return self.found_user_id

    def add_member(self, organization_id, payload):
        self.added_payload = payload
        return {
            "id": str(uuid4()),
            "organization_id": str(organization_id),
            "user_id": str(payload.user_id),
            "role": payload.role,
            "created_at": "2026-05-25T00:00:00+00:00",
            "updated_at": "2026-05-25T00:00:00+00:00",
        }


def test_add_member_resolves_email_to_user_id() -> None:
    repo = EmailLookupRepo()
    service = OrganizationService(repo)
    member = service.add_member(ORG_ID, AddOrganizationMemberRequest(email="Person@Example.com", role="member"))
    assert UUID(member["user_id"]) == USER_ID
    assert repo.added_payload.user_id == USER_ID


def test_add_member_by_unknown_email_fails() -> None:
    repo = EmailLookupRepo(found_user_id=None)
    service = OrganizationService(repo)
    with pytest.raises(NotFoundError):
        service.add_member(ORG_ID, AddOrganizationMemberRequest(email="missing@example.com", role="member"))
