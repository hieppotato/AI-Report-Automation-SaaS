import logging
from decimal import Decimal
from uuid import UUID

from app.core.exceptions import NotFoundError
from app.repositories.report_repo import ReportRepository
from app.schemas.pagination import PaginatedResponse, PaginationParams
from app.schemas.report import ReportCreate, ReportStatusResponse, ReportSummaryResponse, ReportUpdate

logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self, repo: ReportRepository) -> None:
        self.repo = repo

    def list_reports(self, organization_id: UUID, pagination: PaginationParams) -> PaginatedResponse[dict]:
        items, total = self.repo.get_reports_by_org(organization_id, pagination.limit, pagination.offset)
        return PaginatedResponse(items=items, total=total, limit=pagination.limit, offset=pagination.offset)

    def get_report(self, organization_id: UUID, report_id: UUID) -> dict:
        report = self.repo.get_report_by_id(organization_id, report_id)
        if not report:
            raise NotFoundError("Report not found.")
        return report

    def create_report(self, organization_id: UUID, payload: ReportCreate) -> dict:
        logger.info("Creating report - org=%s payload=%s", organization_id, payload.model_dump(exclude_unset=True))
        result = self.repo.create_report(organization_id, payload)
        logger.info("Report created - id=%s", result.get("id"))
        return result

    def update_report(self, organization_id: UUID, report_id: UUID, payload: ReportUpdate) -> dict:
        if not payload.model_fields_set:
            return self.get_report(organization_id, report_id)
        report = self.repo.update_report(organization_id, report_id, payload)
        if not report:
            raise NotFoundError("Report not found.")
        return report

    def delete_report(self, organization_id: UUID, report_id: UUID) -> None:
        deleted = self.repo.delete_report(organization_id, report_id)
        if not deleted:
            raise NotFoundError("Report not found.")

    def get_summary(self, organization_id: UUID) -> ReportSummaryResponse:
        reports = self.repo.get_report_summary(organization_id)
        total_reports = len(reports)
        total_revenue = sum((Decimal(str(row.get("total_revenue") or 0)) for row in reports), Decimal("0"))
        total_orders = sum(int(row.get("total_orders") or 0) for row in reports)
        avg_order_value = total_revenue / Decimal(total_orders) if total_orders > 0 else Decimal("0")
        repeat_rates = [Decimal(str(row.get("repeat_rate"))) for row in reports if row.get("repeat_rate") is not None]
        repeat_customer_rate = sum(repeat_rates, Decimal("0")) / Decimal(len(repeat_rates)) if repeat_rates else Decimal("0")
        latest_report_date = max((row.get("created_at") for row in reports if row.get("created_at")), default=None)
        return ReportSummaryResponse(
            total_reports=total_reports,
            latest_report_date=latest_report_date,
            total_revenue=total_revenue,
            total_orders=total_orders,
            avg_order_value=avg_order_value,
            repeat_customer_rate=repeat_customer_rate,
        )

    def get_status(self, organization_id: UUID, report_id: UUID) -> ReportStatusResponse:
        report = self.get_report(organization_id, report_id)
        return ReportStatusResponse(
            id=report["id"],
            status=report.get("status") or "draft",
            progress=report.get("progress") or 0,
            current_step=report.get("current_step"),
            error=report.get("error_message"),
        )
