import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.core.config import settings
from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.repositories.invitation_repo import InvitationRepository
from app.repositories.organization_repo import OrganizationRepository
from app.schemas.invitation import InvitationCreate
from app.schemas.organization import AddOrganizationMemberRequest
from app.schemas.pagination import PaginatedResponse, PaginationParams


class InvitationService:
    def __init__(self, invitation_repo: InvitationRepository, organization_repo: OrganizationRepository) -> None:
        self.invitation_repo = invitation_repo
        self.organization_repo = organization_repo

    def create_invitation(self, organization_id: UUID, payload: InvitationCreate) -> dict:
        token = secrets.token_urlsafe(32)
        invitation = self.invitation_repo.create_invitation(
            {
                "organization_id": str(organization_id),
                "email": payload.email,
                "role": payload.role,
                "token": token,
                "status": "pending",
                "expires_at": (datetime.now(tz=timezone.utc) + timedelta(days=7)).isoformat(),
            }
        )
        return self._with_accept_url(invitation)

    def list_invitations(self, organization_id: UUID, pagination: PaginationParams) -> PaginatedResponse[dict]:
        items, total = self.invitation_repo.list_invitations(organization_id, pagination.limit, pagination.offset)
        return PaginatedResponse(
            items=[self._with_accept_url(item) for item in items],
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    def delete_invitation(self, organization_id: UUID, invitation_id: UUID) -> None:
        if not self.invitation_repo.delete_invitation(organization_id, invitation_id):
            raise NotFoundError("Invitation not found.")

    def accept_invitation(self, token: str, user_id: UUID, user_email: str | None) -> dict:
        invitation = self.invitation_repo.get_by_token(token)
        if not invitation:
            raise NotFoundError("Invitation not found.")
        if invitation.get("status") != "pending":
            raise PermissionDeniedError("Invitation is no longer pending.")
        expires_at = datetime.fromisoformat(str(invitation["expires_at"]).replace("Z", "+00:00"))
        if expires_at < datetime.now(tz=timezone.utc):
            self.invitation_repo.update_status(UUID(str(invitation["id"])), "expired")
            raise PermissionDeniedError("Invitation has expired.")
        if not user_email or user_email.strip().lower() != str(invitation["email"]).lower():
            raise PermissionDeniedError("Invitation email does not match the current user.")

        organization_id = UUID(str(invitation["organization_id"]))
        self.organization_repo.add_member(
            organization_id,
            AddOrganizationMemberRequest(user_id=user_id, role=invitation["role"]),
        )
        updated = self.invitation_repo.update_status(UUID(str(invitation["id"])), "accepted")
        return self._with_accept_url(updated or invitation)

    def _with_accept_url(self, invitation: dict) -> dict:
        token = invitation.get("token")
        accept_url = f"{settings.app_frontend_url.rstrip('/')}/invitations/accept?token={token}"
        return {**invitation, "accept_url": accept_url}
