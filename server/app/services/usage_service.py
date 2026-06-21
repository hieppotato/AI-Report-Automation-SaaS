from datetime import datetime, timezone
from uuid import UUID

from app.core.exceptions import NotFoundError, PlanLimitError, QuotaExceededError
from app.repositories.usage_repo import UsageRepository
from app.schemas.usage import UsageCurrentResponse

FREE_REPORTS_LIMIT = 5
FREE_STORAGE_LIMIT_MB = 50
PRO_STORAGE_LIMIT_MB = 1024


class UsageService:
    def __init__(self, repo: UsageRepository) -> None:
        self.repo = repo

    def get_current_usage(self, organization_id: UUID) -> UsageCurrentResponse:
        plan = self._plan_for_org(organization_id)
        reports_used = self._reports_this_month(organization_id)
        storage_bytes = self.repo.sum_storage_bytes(organization_id)
        return UsageCurrentResponse(
            plan=plan,
            reports_used=reports_used,
            reports_limit=None if plan == "pro" else FREE_REPORTS_LIMIT,
            storage_used_mb=round(storage_bytes / 1024 / 1024, 2),
            storage_limit_mb=PRO_STORAGE_LIMIT_MB if plan == "pro" else FREE_STORAGE_LIMIT_MB,
        )

    def enforce_report_creation(self, organization_id: UUID) -> None:
        if self._plan_for_org(organization_id) == "pro":
            return
        if self._reports_this_month(organization_id) >= FREE_REPORTS_LIMIT:
            raise QuotaExceededError("Free plan allows up to 5 reports per month.")

    def enforce_storage_upload(self, organization_id: UUID, incoming_size_bytes: int) -> None:
        plan = self._plan_for_org(organization_id)
        limit_mb = PRO_STORAGE_LIMIT_MB if plan == "pro" else FREE_STORAGE_LIMIT_MB
        limit_bytes = limit_mb * 1024 * 1024
        if self.repo.sum_storage_bytes(organization_id) + incoming_size_bytes > limit_bytes:
            raise QuotaExceededError(f"{plan.title()} plan storage limit exceeded.")

    def enforce_export_format(self, organization_id: UUID, export_format: str) -> None:
        if export_format == "docx" and self._plan_for_org(organization_id) != "pro":
            raise PlanLimitError("DOCX exports require the Pro plan.")

    def _reports_this_month(self, organization_id: UUID) -> int:
        now = datetime.now(tz=timezone.utc)
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 1)
        return self.repo.count_reports_between(organization_id, start, end)

    def _plan_for_org(self, organization_id: UUID) -> str:
        organization = self.repo.get_organization(organization_id)
        if not organization:
            raise NotFoundError("Organization not found.")
        return "pro" if (organization.get("plan") or "").lower() == "pro" else "free"
