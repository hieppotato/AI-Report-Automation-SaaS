from uuid import UUID

from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError
from app.repositories.organization_repo import OrganizationRepository
from app.schemas.organization import AddOrganizationMemberRequest, OrganizationCreate


class OrganizationService:
    def __init__(self, repo: OrganizationRepository) -> None:
        self.repo = repo

    def get_organization(self, organization_id: UUID) -> dict | None:
        return self.repo.get_by_id(organization_id)

    def list_user_organizations(self, user_id: UUID) -> list[dict]:
        return self.repo.get_user_orgs(user_id)

    def create_organization(self, payload: OrganizationCreate, owner_id: UUID) -> dict:
        if payload.slug and self.repo.get_by_slug(payload.slug):
            raise ConflictError("Organization slug is already in use.")
        organization = self.repo.create_org(payload, owner_id)
        self.repo.create_owner_membership(UUID(str(organization["id"])), owner_id)
        return organization

    def get_membership(self, organization_id: UUID, user_id: UUID) -> dict | None:
        return self.repo.get_membership(organization_id, user_id)

    def list_members(self, organization_id: UUID) -> list[dict]:
        return self.repo.list_members(organization_id)

    def add_member(self, organization_id: UUID, payload: AddOrganizationMemberRequest) -> dict:
        if not self.repo.get_by_id(organization_id):
            raise NotFoundError("Organization not found.")
        return self.repo.add_member(organization_id, payload)

    def remove_member(
        self,
        organization_id: UUID,
        user_id: UUID,
        requester_role: str,
        requester_id: UUID,
    ) -> None:
        target = self.repo.get_membership(organization_id, user_id)
        if not target:
            raise NotFoundError("Organization member not found.")
        if target["role"] == "owner" and requester_role != "owner":
            raise PermissionDeniedError("Only an owner can remove another owner.")
        if user_id == requester_id and target["role"] == "owner":
            owner_count = sum(1 for member in self.repo.list_members(organization_id) if member["role"] == "owner")
            if owner_count <= 1:
                raise PermissionDeniedError("The last organization owner cannot be removed.")
        self.repo.remove_member(organization_id, user_id)
