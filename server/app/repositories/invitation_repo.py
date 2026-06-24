from typing import Any
from uuid import UUID

from supabase import Client

from app.repositories.base import execute_query, first_or_none, response_count


class InvitationRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def create_invitation(self, data: dict[str, Any]) -> dict[str, Any]:
        response = execute_query(
            lambda: self.supabase.table("organization_invitations").insert(data).execute(),
            "Failed to create invitation",
        )
        return response.data[0]

    def list_invitations(self, organization_id: UUID, limit: int, offset: int) -> tuple[list[dict[str, Any]], int]:
        response = execute_query(
            lambda: self.supabase.table("organization_invitations")
            .select("*", count="exact")
            .eq("organization_id", str(organization_id))
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute(),
            "Failed to list invitations",
        )
        return response.data or [], response_count(response)

    def get_by_id(self, organization_id: UUID, invitation_id: UUID) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organization_invitations")
            .select("*")
            .eq("organization_id", str(organization_id))
            .eq("id", str(invitation_id))
            .limit(1)
            .execute(),
            "Failed to fetch invitation",
        )
        return first_or_none(response.data)

    def get_by_token(self, token: str) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organization_invitations")
            .select("*")
            .eq("token", token)
            .limit(1)
            .execute(),
            "Failed to fetch invitation",
        )
        return first_or_none(response.data)

    def update_status(self, invitation_id: UUID, status: str) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organization_invitations")
            .update({"status": status})
            .eq("id", str(invitation_id))
            .execute(),
            "Failed to update invitation",
        )
        return first_or_none(response.data)

    def delete_invitation(self, organization_id: UUID, invitation_id: UUID) -> bool:
        response = execute_query(
            lambda: self.supabase.table("organization_invitations")
            .delete()
            .eq("organization_id", str(organization_id))
            .eq("id", str(invitation_id))
            .execute(),
            "Failed to delete invitation",
        )
        return bool(response.data)

    def list_by_email(self, email: str) -> list[dict]:
        """Return all pending invitations for a given email across all organizations."""
        response = execute_query(
            lambda: self.supabase.table("organization_invitations")
            .select("*")
            .eq("email", email.strip().lower())
            .eq("status", "pending")
            .order("created_at", desc=True)
            .execute(),
            "Failed to list invitations by email",
        )
        return response.data or []

