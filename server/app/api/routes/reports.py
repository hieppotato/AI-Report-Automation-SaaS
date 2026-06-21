import logging
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Response, UploadFile, status

from app.api.deps import (
    get_audit_service,
    get_report_repository,
    get_storage_service,
    get_upload_repository,
    get_report_service,
    get_usage_service,
    require_org_member,
)
from app.core.exceptions import RepositoryError
from app.schemas.auth import OrganizationContext
from app.schemas.pagination import PaginatedResponse, PaginationParams, get_pagination_params
from app.schemas.report import ReportCreate, ReportResponse, ReportStatusResponse, ReportSummaryResponse, ReportUpdate
from app.schemas.upload import UploadCreate
from app.repositories.report_repo import ReportRepository
from app.repositories.upload_repo import UploadRepository
from app.services.ai_pipeline import AIPipelineService
from app.services.audit_service import AuditService
from app.services.storage_service import StorageService
from app.services.report_service import ReportService
from app.services.usage_service import UsageService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{organization_id}/reports/summary", response_model=ReportSummaryResponse)
def get_report_summary(
    organization_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
) -> ReportSummaryResponse:
    return service.get_summary(organization_id)


@router.get("/{organization_id}/reports", response_model=PaginatedResponse[ReportResponse])
def list_reports(
    organization_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    pagination: PaginationParams = Depends(get_pagination_params),
    service: ReportService = Depends(get_report_service),
) -> PaginatedResponse[dict]:
    return service.list_reports(organization_id, pagination)


@router.post(
    "/{organization_id}/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_report(
    organization_id: UUID,
    payload: ReportCreate,
    context: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
    usage_service: UsageService = Depends(get_usage_service),
    audit: AuditService = Depends(get_audit_service),
) -> dict:
    usage_service.enforce_report_creation(organization_id)
    report = service.create_report(organization_id, payload)
    audit.log_event(organization_id, context.user_id, "report.created", "report", str(report.get("id")))
    return report


@router.post("/{organization_id}/reports/{report_id}/upload", response_model=ReportResponse)
async def upload_report_file(
    organization_id: UUID,
    report_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    context: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
    report_repo: ReportRepository = Depends(get_report_repository),
    upload_repo: UploadRepository = Depends(get_upload_repository),
    storage_service: StorageService = Depends(get_storage_service),
    usage_service: UsageService = Depends(get_usage_service),
) -> dict:
    service.get_report(organization_id, report_id)
    content = await file.read()
    usage_service.enforce_storage_upload(organization_id, len(content))
    await file.seek(0)
    report_repo.update_report_fields(
        organization_id,
        report_id,
        {"status": "uploading", "progress": 10, "current_step": "Uploading file", "error_message": None},
    )
    try:
        stored_file = await storage_service.upload_report_file(organization_id, report_id, file)
        upload_id = None
        try:
            upload = upload_repo.create_upload(
                organization_id,
                context.user_id,
                UploadCreate(
                    file_name=stored_file["file_name"],
                    file_path=stored_file["file_path"],
                    mime_type=stored_file["mime_type"],
                    size_bytes=stored_file["size_bytes"],
                    status="processing",
                ),
            )
            upload_id = upload["id"]
        except RepositoryError as exc:
            logger.warning(
                "Report upload metadata insert failed; continuing with reports.file_url - org=%s report=%s error=%s",
                organization_id,
                report_id,
                exc.message,
            )
        report = report_repo.update_report_fields(
            organization_id,
            report_id,
            {
                "upload_id": upload_id,
                "status": "processing",
                "progress": 10,
                "current_step": "Uploading file",
                "file_url": stored_file["file_path"],
                "file_name": stored_file["file_name"],
                "file_type": stored_file["mime_type"],
                "error_message": None,
            },
        )
    except Exception as exc:
        report_repo.update_report_fields(
            organization_id,
            report_id,
            {"status": "failed", "current_step": "Failed", "error_message": str(exc) or "Upload failed."},
        )
        raise

    pipeline = AIPipelineService(report_repo, storage_service)
    background_tasks.add_task(pipeline.run_report_pipeline, organization_id, report_id)
    return report or service.get_report(organization_id, report_id)


@router.get("/{organization_id}/reports/{report_id}", response_model=ReportResponse)
def get_report(
    organization_id: UUID,
    report_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
) -> dict:
    return service.get_report(organization_id, report_id)


@router.get("/{organization_id}/reports/{report_id}/status", response_model=ReportStatusResponse)
def get_report_status(
    organization_id: UUID,
    report_id: UUID,
    _: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
) -> ReportStatusResponse:
    return service.get_status(organization_id, report_id)


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
    context: OrganizationContext = Depends(require_org_member),
    service: ReportService = Depends(get_report_service),
    audit: AuditService = Depends(get_audit_service),
) -> Response:
    service.delete_report(organization_id, report_id)
    audit.log_event(organization_id, context.user_id, "report.deleted", "report", str(report_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
