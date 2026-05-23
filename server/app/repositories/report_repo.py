from typing import Any
from uuid import UUID

from supabase import Client

from app.repositories.base import execute_query, first_or_none
from app.schemas.report import ReportCreate, ReportUpdate


class ReportRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def get_reports_by_org(self, organization_id: UUID) -> list[dict[str, Any]]:
        response = execute_query(
            lambda: self.supabase.table("reports")
            .select("*")
            .eq("organization_id", str(organization_id))
            .order("created_at", desc=True)
            .execute(),
            "Failed to list reports",
        )
        return response.data or []

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
        response = execute_query(
            lambda: self.supabase.table("reports").insert(data).execute(),
            "Failed to create report",
        )
        return response.data[0]

    def update_report(self, organization_id: UUID, report_id: UUID, payload: ReportUpdate) -> dict[str, Any] | None:
        data = payload.model_dump(mode="json", exclude_unset=True)
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
