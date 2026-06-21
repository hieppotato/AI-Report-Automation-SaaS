from datetime import datetime
from typing import Any
from uuid import UUID

from supabase import Client

from app.repositories.base import execute_query, response_count


class AuditRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def create_event(
        self,
        organization_id: UUID,
        actor_id: UUID | None,
        action: str,
        target_type: str,
        target_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        data = {
            "organization_id": str(organization_id),
            "actor_id": str(actor_id) if actor_id else None,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "metadata": metadata or {},
        }
        response = execute_query(
            lambda: self.supabase.table("audit_events").insert(data).execute(),
            "Failed to create audit event",
        )
        return response.data[0]

    def list_events(
        self,
        organization_id: UUID,
        limit: int,
        offset: int,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        actor_id: UUID | None = None,
        action: str | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        query = self.supabase.table("audit_events").select("*", count="exact").eq("organization_id", str(organization_id))
        if date_from:
            query = query.gte("created_at", date_from.isoformat())
        if date_to:
            query = query.lte("created_at", date_to.isoformat())
        if actor_id:
            query = query.eq("actor_id", str(actor_id))
        if action:
            query = query.eq("action", action)
        response = execute_query(
            lambda: query.order("created_at", desc=True).range(offset, offset + limit - 1).execute(),
            "Failed to list audit events",
        )
        return response.data or [], response_count(response)
