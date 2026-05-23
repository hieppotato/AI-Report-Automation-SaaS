from uuid import UUID

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_report_service, require_org_member
from app.schemas.auth import OrganizationContext
from app.schemas.report import ReportCreate, ReportResponse, ReportUpdate
from app.services.report_service import ReportService

router = APIRouter()


@router.get("/{organization_id}/reports", response_model=list[ReportResponse])
def list_reports(
    organization_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
) -> list[dict]:
    return service.list_reports(organization_id)


@router.post(
    "/{organization_id}/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_report(
    organization_id: UUID,
    payload: ReportCreate,
    _: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
) -> dict:
    return service.create_report(organization_id, payload)


@router.get("/{organization_id}/reports/{report_id}", response_model=ReportResponse)
def get_report(
    organization_id: UUID,
    report_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
) -> dict:
    return service.get_report(organization_id, report_id)


@router.patch("/{organization_id}/reports/{report_id}", response_model=ReportResponse)
def update_report(
    organization_id: UUID,
    report_id: UUID,
    payload: ReportUpdate,
    _: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
) -> dict:
    return service.update_report(organization_id, report_id, payload)


@router.delete("/{organization_id}/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    organization_id: UUID,
    report_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
) -> Response:
    service.delete_report(organization_id, report_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
