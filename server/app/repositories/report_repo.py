import logging
from typing import Any
from uuid import UUID

from supabase import Client

from app.repositories.base import execute_query, first_or_none, response_count
from app.schemas.report import ReportCreate, ReportUpdate

logger = logging.getLogger(__name__)

ALLOWED_REPORT_COLUMNS = frozenset(
    {
        "id",
        "organization_id",
        "upload_id",
        "title",
        "description",
        "status",
        "progress",
        "current_step",
        "file_url",
        "file_name",
        "file_type",
        "report_json",
        "error_message",
        "total_revenue",
        "total_orders",
        "aov",
        "repeat_rate",
        "insights",
        "anomalies",
        "charts",
        "created_at",
        "updated_at",
    }
)


def _filter_payload(data: dict[str, Any]) -> dict[str, Any]:
    filtered = {key: value for key, value in data.items() if key in ALLOWED_REPORT_COLUMNS}
    removed = set(data.keys()) - set(filtered.keys())
    if removed:
        logger.warning("Stripped invalid report columns before DB operation: %s", removed)
    return filtered


class ReportRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def get_reports_by_org(self, organization_id: UUID, limit: int, offset: int) -> tuple[list[dict[str, Any]], int]:
        response = execute_query(
            lambda: self.supabase.table("reports")
            .select("*", count="exact")
            .eq("organization_id", str(organization_id))
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute(),
            "Failed to list reports",
        )
        return response.data or [], response_count(response)

    def get_report_by_id(self, organization_id: UUID, report_id: UUID) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("reports")
            .select("*")
            .eq("organization_id", str(organization_id))
            .eq("id", str(report_id))
            .limit(1)
            .execute(),
            "Failed to fetch report",
        )
        return first_or_none(response.data)

    def create_report(self, organization_id: UUID, payload: ReportCreate) -> dict[str, Any]:
        data = payload.model_dump(mode="json", exclude_unset=True)
        data["organization_id"] = str(organization_id)
        data.setdefault("status", "draft")
        data.setdefault("progress", 0)
        data = _filter_payload(data)
        logger.info("Creating report - org=%s payload_keys=%s", organization_id, list(data.keys()))
        response = execute_query(
            lambda: self.supabase.table("reports").insert(data).execute(),
            "Failed to create report",
        )
        return response.data[0]

    def update_report_fields(
        self,
        organization_id: UUID,
        report_id: UUID,
        fields: dict[str, Any],
    ) -> dict[str, Any] | None:
        fields = _filter_payload(fields)
        logger.info("Updating report fields - org=%s report=%s keys=%s", organization_id, report_id, list(fields.keys()))
        if not fields:
            logger.warning("update_report_fields called with empty payload after filtering - skipping")
            return self.get_report_by_id(organization_id, report_id)
        response = execute_query(
            lambda: self.supabase.table("reports")
            .update(fields)
            .eq("organization_id", str(organization_id))
            .eq("id", str(report_id))
            .execute(),
            "Failed to update report",
        )
        return first_or_none(response.data)

    def update_report(self, organization_id: UUID, report_id: UUID, payload: ReportUpdate) -> dict[str, Any] | None:
        data = _filter_payload(payload.model_dump(mode="json", exclude_unset=True))
        logger.info("Updating report - org=%s report=%s keys=%s", organization_id, report_id, list(data.keys()))
        if not data:
            return self.get_report_by_id(organization_id, report_id)
        response = execute_query(
            lambda: self.supabase.table("reports")
            .update(data)
            .eq("organization_id", str(organization_id))
            .eq("id", str(report_id))
            .execute(),
            "Failed to update report",
        )
        return first_or_none(response.data)

    def delete_report(self, organization_id: UUID, report_id: UUID) -> bool:
        response = execute_query(
            lambda: self.supabase.table("reports")
            .delete()
            .eq("organization_id", str(organization_id))
            .eq("id", str(report_id))
            .execute(),
            "Failed to delete report",
        )
        return bool(response.data)

    def get_report_summary(self, organization_id: UUID) -> list[dict[str, Any]]:
        response = execute_query(
            lambda: self.supabase.table("reports")
            .select("created_at,total_revenue,total_orders,aov,repeat_rate")
            .eq("organization_id", str(organization_id))
            .execute(),
            "Failed to fetch report summary",
        )
        return response.data or []
