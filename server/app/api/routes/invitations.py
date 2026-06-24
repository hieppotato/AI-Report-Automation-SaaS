from uuid import UUID

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_audit_service, get_current_user, get_invitation_service, require_org_admin, require_org_member
from app.schemas.auth import CurrentUser, OrganizationContext
from app.schemas.invitation import InvitationAccept, InvitationCreate, InvitationResponse, InvitationWithOrgResponse
from app.schemas.pagination import PaginatedResponse, PaginationParams, get_pagination_params
from app.services.audit_service import AuditService
from app.services.invitation_service import InvitationService

router = APIRouter()
public_router = APIRouter()


@router.post("/{organization_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def create_invitation(
    organization_id: UUID,
    payload: InvitationCreate,
    context: OrganizationContext = Depends(require_org_admin),
    service: InvitationService = Depends(get_invitation_service),
    audit: AuditService = Depends(get_audit_service),
) -> dict:
    invitation = service.create_invitation(organization_id, payload)
    audit.log_event(
        organization_id,
        context.user_id,
        "member.invited",
        "organization_invitation",
        str(invitation["id"]),
        {"email": invitation["email"], "role": invitation["role"]},
    )
    return invitation


@router.post("/{organization_id}/invitations/{invitation_id}/resend", response_model=InvitationResponse)
def resend_invitation(
    organization_id: UUID,
    invitation_id: UUID,
    context: OrganizationContext = Depends(require_org_admin),
    service: InvitationService = Depends(get_invitation_service),
    audit: AuditService = Depends(get_audit_service),
) -> dict:
    invitation = service.resend_invitation(organization_id, invitation_id)
    audit.log_event(
        organization_id,
        context.user_id,
        "member.invitation_resent",
        "organization_invitation",
        str(invitation["id"]),
        {"email": invitation["email"], "role": invitation["role"]},
    )
    return invitation


@router.get("/{organization_id}/invitations", response_model=PaginatedResponse[InvitationResponse])
def list_invitations(
    organization_id: UUID,
    _: OrganizationContext = Depends(require_org_admin),
    pagination: PaginationParams = Depends(get_pagination_params),
    service: InvitationService = Depends(get_invitation_service),
) -> PaginatedResponse[dict]:
    return service.list_invitations(organization_id, pagination)


@router.delete("/{organization_id}/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invitation(
    organization_id: UUID,
    invitation_id: UUID,
    context: OrganizationContext = Depends(require_org_admin),
    service: InvitationService = Depends(get_invitation_service),
    audit: AuditService = Depends(get_audit_service),
) -> Response:
    service.delete_invitation(organization_id, invitation_id)
    audit.log_event(
        organization_id,
        context.user_id,
        "member.invitation_cancelled",
        "organization_invitation",
        str(invitation_id),
        {},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@public_router.get("/mine", response_model=list[InvitationWithOrgResponse])
def list_my_invitations(
    current_user: CurrentUser = Depends(get_current_user),
    service: InvitationService = Depends(get_invitation_service),
) -> list[dict]:
    """Return all pending invitations for the authenticated user's email."""
    if not current_user.email:
        return []
    return service.list_my_invitations(current_user.email)


@public_router.post("/accept", response_model=InvitationResponse)
def accept_invitation(
    payload: InvitationAccept,
    current_user: CurrentUser = Depends(get_current_user),
    service: InvitationService = Depends(get_invitation_service),
    audit: AuditService = Depends(get_audit_service),
) -> dict:
    invitation = service.accept_invitation(payload.token, current_user.id, current_user.email)
    audit.log_event(
        UUID(str(invitation["organization_id"])),
        current_user.id,
        "member.invitation_accepted",
        "organization_invitation",
        str(invitation["id"]),
        {},
    )
    return invitation

