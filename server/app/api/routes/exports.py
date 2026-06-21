from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_audit_service, get_export_service, get_usage_service, require_org_member
from app.schemas.auth import OrganizationContext
from app.schemas.export import ReportExportResponse
from app.services.export_service import ExportService
from app.services.audit_service import AuditService
from app.services.usage_service import UsageService

router = APIRouter()


@router.get("/{organization_id}/reports/{report_id}/export/pdf", response_model=ReportExportResponse)
def export_report_pdf(
    organization_id: UUID,
    report_id: UUID,
    context: OrganizationContext = Depends(require_org_member),
    service: ExportService = Depends(get_export_service),
    audit: AuditService = Depends(get_audit_service),
) -> ReportExportResponse:
    response = service.export_report(organization_id, report_id, "pdf")
    audit.log_event(organization_id, context.user_id, "report.exported", "report", str(report_id), {"format": "pdf"})
    return response


@router.get("/{organization_id}/reports/{report_id}/export/docx", response_model=ReportExportResponse)
def export_report_docx(
    organization_id: UUID,
    report_id: UUID,
    context: OrganizationContext = Depends(require_org_member),
    service: ExportService = Depends(get_export_service),
    usage_service: UsageService = Depends(get_usage_service),
    audit: AuditService = Depends(get_audit_service),
) -> ReportExportResponse:
    usage_service.enforce_export_format(organization_id, "docx")
    response = service.export_report(organization_id, report_id, "docx")
    audit.log_event(organization_id, context.user_id, "report.exported", "report", str(report_id), {"format": "docx"})
    return response


@router.delete("/{organization_id}/reports/{report_id}/export/{export_index}", status_code=204)
def delete_report_export(
    organization_id: UUID,
    report_id: UUID,
    export_index: int,
    _: OrganizationContext = Depends(require_org_member),
    service: ExportService = Depends(get_export_service),
) -> None:
    service.delete_export(organization_id, report_id, export_index)
