from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, Path
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.core.security import current_user_from_token, extract_bearer_token
from app.core.supabase import get_supabase_admin
from app.repositories.organization_repo import OrganizationRepository
from app.repositories.profile_repo import ProfileRepository
from app.repositories.report_repo import ReportRepository
from app.repositories.upload_repo import UploadRepository
from app.schemas.auth import CurrentUser, OrganizationContext
from app.services.organization_service import OrganizationService
from app.services.profile_service import ProfileService
from app.services.report_service import ReportService
from app.services.upload_service import UploadService
from app.services.storage_service import StorageService

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    token = extract_bearer_token(credentials)
    try:
        return current_user_from_token(token)
    except HTTPException as local_error:
        try:
            supabase = get_supabase_admin()
        except Exception:
            raise local_error
        return current_user_from_token(token, supabase)


def get_organization_repository(
    supabase: Client = Depends(get_supabase_admin),
) -> OrganizationRepository:
    return OrganizationRepository(supabase)


def get_report_repository(
    supabase: Client = Depends(get_supabase_admin),
) -> ReportRepository:
    return ReportRepository(supabase)


def get_profile_repository(
    supabase: Client = Depends(get_supabase_admin),
) -> ProfileRepository:
    return ProfileRepository(supabase)


def get_upload_repository(
    supabase: Client = Depends(get_supabase_admin),
) -> UploadRepository:
    return UploadRepository(supabase)


def get_organization_service(
    repo: OrganizationRepository = Depends(get_organization_repository),
) -> OrganizationService:
    return OrganizationService(repo)


def get_report_service(
    repo: ReportRepository = Depends(get_report_repository),
) -> ReportService:
    return ReportService(repo)


def get_profile_service(
    repo: ProfileRepository = Depends(get_profile_repository),
) -> ProfileService:
    return ProfileService(repo)


def get_upload_service(
    repo: UploadRepository = Depends(get_upload_repository),
) -> UploadService:
    return UploadService(repo)


def get_storage_service(
    supabase: Client = Depends(get_supabase_admin),
) -> StorageService:
    return StorageService(supabase)


def require_org_member(
    organization_id: UUID = Path(...),
    current_user: CurrentUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_organization_service),
) -> OrganizationContext:
    org = service.get_organization(organization_id)
    membership = service.get_membership(organization_id, current_user.id)
    if not org or not membership:
        raise NotFoundError("Organization not found.")
    return OrganizationContext(
        organization_id=organization_id,
        user_id=current_user.id,
        role=membership["role"],
        organization=org,
        membership=membership,
    )


def require_org_admin(
    context: OrganizationContext = Depends(require_org_member),
) -> OrganizationContext:
    if context.role not in {"owner", "admin"}:
        raise PermissionDeniedError("Organization admin access is required.")
    return context


def require_org_owner(
    context: OrganizationContext = Depends(require_org_member),
) -> OrganizationContext:
    if context.role != "owner":
        raise PermissionDeniedError("Organization owner access is required.")
    return context


def role_guard(*allowed_roles: str) -> Callable[[OrganizationContext], OrganizationContext]:
    def dependency(context: OrganizationContext = Depends(require_org_member)) -> OrganizationContext:
        if context.role not in allowed_roles:
            raise PermissionDeniedError("Insufficient organization permissions.")
        return context

    return dependency
