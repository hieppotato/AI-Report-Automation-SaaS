from typing import Any
from uuid import UUID

from supabase import Client

from app.repositories.base import execute_query, first_or_none


class BillingRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def get_subscription(self, organization_id: UUID) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("subscriptions")
            .select("*")
            .eq("organization_id", str(organization_id))
            .limit(1)
            .execute(),
            "Failed to fetch subscription",
        )
        return first_or_none(response.data)

    def upsert_subscription(self, organization_id: UUID, fields: dict[str, Any]) -> dict[str, Any]:
        data = {"organization_id": str(organization_id), **fields}
        response = execute_query(
            lambda: self.supabase.table("subscriptions").upsert(data, on_conflict="organization_id").execute(),
            "Failed to update subscription",
        )
        return response.data[0]

    def update_organization_plan(self, organization_id: UUID, plan: str) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organizations").update({"plan": plan}).eq("id", str(organization_id)).execute(),
            "Failed to update organization plan",
        )
        return first_or_none(response.data)
