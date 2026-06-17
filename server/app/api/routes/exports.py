from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_export_service, require_org_member
from app.schemas.auth import OrganizationContext
from app.schemas.export import ReportExportResponse
from app.services.export_service import ExportService

router = APIRouter()


@router.get("/{organization_id}/reports/{report_id}/export/pdf", response_model=ReportExportResponse)
def export_report_pdf(
    organization_id: UUID,
    report_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    service: ExportService = Depends(get_export_service),
) -> ReportExportResponse:
    return service.export_report(organization_id, report_id, "pdf")


@router.get("/{organization_id}/reports/{report_id}/export/docx", response_model=ReportExportResponse)
def export_report_docx(
    organization_id: UUID,
    report_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    service: ExportService = Depends(get_export_service),
) -> ReportExportResponse:
    return service.export_report(organization_id, report_id, "docx")


@router.delete("/{organization_id}/reports/{report_id}/export/{export_index}", status_code=204)
def delete_report_export(
    organization_id: UUID,
    report_id: UUID,
    export_index: int,
    _: OrganizationContext = Depends(require_org_member),
    service: ExportService = Depends(get_export_service),
) -> None:
    service.delete_export(organization_id, report_id, export_index)

