from uuid import UUID

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import (
    get_current_user,
    get_organization_service,
    require_org_admin,
    require_org_member,
)
from app.schemas.auth import CurrentUser, OrganizationContext
from app.schemas.organization import (
    AddOrganizationMemberRequest,
    OrganizationCreate,
    OrganizationMemberResponse,
    OrganizationMemberUpdate,
    OrganizationResponse,
)
from app.schemas.pagination import PaginatedResponse, PaginationParams, get_pagination_params
from app.services.organization_service import OrganizationService

router = APIRouter()


@router.get("", response_model=list[OrganizationResponse])
def list_organizations(
    current_user: CurrentUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_organization_service),
) -> list[dict]:
    return service.list_user_organizations(current_user.id)


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    current_user: CurrentUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_organization_service),
) -> dict:
    return service.create_organization(payload, current_user.id)


@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization(
    context: OrganizationContext = Depends(require_org_member),
) -> dict:
    return context.organization


@router.get("/{organization_id}/members", response_model=PaginatedResponse[OrganizationMemberResponse])
def list_members(
    organization_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    pagination: PaginationParams = Depends(get_pagination_params),
    service: OrganizationService = Depends(get_organization_service),
) -> PaginatedResponse[dict]:
    return service.list_members(organization_id, pagination)


@router.post(
    "/{organization_id}/members",
    response_model=OrganizationMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    organization_id: UUID,
    payload: AddOrganizationMemberRequest,
    _: OrganizationContext = Depends(require_org_admin),
    service: OrganizationService = Depends(get_organization_service),
) -> dict:
    return service.add_member(organization_id, payload)


@router.patch("/{organization_id}/members/{member_id}", response_model=OrganizationMemberResponse)
def update_member_role(
    organization_id: UUID,
    member_id: UUID,
    payload: OrganizationMemberUpdate,
    context: OrganizationContext = Depends(require_org_admin),
    service: OrganizationService = Depends(get_organization_service),
) -> dict:
    return service.update_member_role(organization_id, member_id, payload, requester_id=context.user_id)


@router.delete("/{organization_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    organization_id: UUID,
    user_id: UUID,
    context: OrganizationContext = Depends(require_org_admin),
    service: OrganizationService = Depends(get_organization_service),
) -> Response:
    service.remove_member(organization_id, user_id, requester_role=context.role, requester_id=context.user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
