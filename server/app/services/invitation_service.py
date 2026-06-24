import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError
from app.repositories.invitation_repo import InvitationRepository
from app.repositories.organization_repo import OrganizationRepository
from app.schemas.invitation import InvitationCreate
from app.schemas.organization import AddOrganizationMemberRequest
from app.schemas.pagination import PaginatedResponse, PaginationParams
from app.services.email_service import EmailService


class InvitationService:
    def __init__(
        self,
        invitation_repo: InvitationRepository,
        organization_repo: OrganizationRepository,
        email_service: EmailService,
    ) -> None:
        self.invitation_repo = invitation_repo
        self.organization_repo = organization_repo
        self.email_service = email_service

    def create_invitation(self, organization_id: UUID, payload: InvitationCreate) -> dict:
        org = self.organization_repo.get_by_id(organization_id)
        org_name = org.get("name", "Workspace") if org else "Workspace"

        existing = self.invitation_repo.list_invitations(organization_id, 100, 0)
        for inv in existing[0] or []:
            if inv.get("email", "").lower() == payload.email.lower() and inv.get("status") == "pending":
                raise ConflictError("A pending invitation already exists for this email.")

        existing_user_id = self.organization_repo.get_user_id_by_email(payload.email)
        if existing_user_id:
            membership = self.organization_repo.get_membership(organization_id, existing_user_id)
            if membership:
                raise ConflictError("This email is already a member of the organization.")

        invited_user_exists = existing_user_id is not None

        token = secrets.token_urlsafe(32)
        invitation = self.invitation_repo.create_invitation(
            {
                "organization_id": str(organization_id),
                "email": payload.email,
                "role": payload.role,
                "token": token,
                "status": "pending",
                "expires_at": (datetime.now(tz=timezone.utc) + timedelta(days=7)).isoformat(),
                "invited_user_exists": invited_user_exists,
            }
        )

        result = self._with_accept_url(invitation)
        accept_url = result["accept_url"]

        self.email_service.send_invitation_email(
            recipient_email=payload.email,
            organization_name=org_name,
            role=payload.role,
            accept_url=accept_url,
            is_new_user=not invited_user_exists,
        )

        return result

    def resend_invitation(self, organization_id: UUID, invitation_id: UUID) -> dict:
        invitation = self.invitation_repo.get_by_id(organization_id, invitation_id)
        if not invitation:
            raise NotFoundError("Invitation not found.")
        if invitation.get("status") != "pending":
            raise PermissionDeniedError("Can only resend pending invitations.")

        org = self.organization_repo.get_by_id(organization_id)
        org_name = org.get("name", "Workspace") if org else "Workspace"

        result = self._with_accept_url(invitation)
        accept_url = result["accept_url"]

        invited_user_exists = invitation.get("invited_user_exists", False)

        self.email_service.send_invitation_email(
            recipient_email=str(invitation["email"]),
            organization_name=org_name,
            role=str(invitation["role"]),
            accept_url=accept_url,
            is_new_user=not invited_user_exists,
        )

        return result

    def list_invitations(self, organization_id: UUID, pagination: PaginationParams) -> PaginatedResponse[dict]:
        items, total = self.invitation_repo.list_invitations(organization_id, pagination.limit, pagination.offset)
        return PaginatedResponse(
            items=[self._with_accept_url(item) for item in items],
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    def list_my_invitations(self, email: str) -> list[dict]:
        """Return all pending invitations for the current user's email, enriched with org name."""
        items = self.invitation_repo.list_by_email(email)
        result = []
        for item in items:
            enriched = self._with_accept_url(item)
            org_id = item.get("organization_id")
            if org_id:
                org = self.organization_repo.get_by_id(UUID(str(org_id)))
                enriched["organization_name"] = org.get("name", "Unknown Workspace") if org else "Unknown Workspace"
            else:
                enriched["organization_name"] = "Unknown Workspace"
            result.append(enriched)
        return result


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
