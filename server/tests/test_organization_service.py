from uuid import uuid4

import pytest

from app.core.exceptions import PermissionDeniedError
from app.schemas.organization import OrganizationMemberUpdate
from app.services.organization_service import OrganizationService


ORG_ID = uuid4()
OWNER_ID = uuid4()
MEMBER_ID = uuid4()


class LastOwnerRepo:
    def get_membership_by_id(self, organization_id, member_id):
        return {
            "id": str(member_id),
            "organization_id": str(organization_id),
            "user_id": str(OWNER_ID),
            "role": "owner",
        }

    def list_members(self, organization_id, limit=None, offset=0):
        return [
            {
                "id": str(MEMBER_ID),
                "organization_id": str(organization_id),
                "user_id": str(OWNER_ID),
                "role": "owner",
            }
        ]

    def update_member_role(self, organization_id, member_id, role):
        return None


def test_last_owner_cannot_downgrade_self() -> None:
    service = OrganizationService(LastOwnerRepo())
    with pytest.raises(PermissionDeniedError):
        service.update_member_role(
            ORG_ID,
            MEMBER_ID,
            OrganizationMemberUpdate(role="admin"),
            requester_id=OWNER_ID,
        )
