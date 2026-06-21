from datetime import datetime
from typing import Any
from uuid import UUID

from supabase import Client

from app.repositories.base import execute_query, response_count


class UsageRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def count_reports_between(self, organization_id: UUID, start: datetime, end: datetime) -> int:
        response = execute_query(
            lambda: self.supabase.table("reports")
            .select("id", count="exact")
            .eq("organization_id", str(organization_id))
            .gte("created_at", start.isoformat())
            .lt("created_at", end.isoformat())
            .execute(),
            "Failed to count report usage",
        )
        return response_count(response)

    def sum_storage_bytes(self, organization_id: UUID) -> int:
        response = execute_query(
            lambda: self.supabase.table("uploads")
            .select("size_bytes")
            .eq("organization_id", str(organization_id))
            .execute(),
            "Failed to calculate storage usage",
        )
        total = 0
        for row in response.data or []:
            total += int(row.get("size_bytes") or 0)
        return total

    def get_organization(self, organization_id: UUID) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organizations")
            .select("id,plan")
            .eq("id", str(organization_id))
            .limit(1)
            .execute(),
            "Failed to fetch organization usage plan",
        )
        rows = response.data or []
        return rows[0] if rows else None
