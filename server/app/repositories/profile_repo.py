from typing import Any
from uuid import UUID

from supabase import Client

from app.repositories.base import execute_query, first_or_none
from app.schemas.profile import ProfileUpdate


class ProfileRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def get_by_user_id(self, user_id: UUID) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("profiles").select("*").eq("id", str(user_id)).limit(1).execute(),
            "Failed to fetch profile",
        )
        return first_or_none(response.data)

    def create_if_missing(self, user_id: UUID) -> dict[str, Any]:
        response = execute_query(
            lambda: self.supabase.table("profiles")
            .upsert({"id": str(user_id)}, on_conflict="id")
            .execute(),
            "Failed to create profile",
        )
        return response.data[0]

    def update_profile(self, user_id: UUID, payload: ProfileUpdate) -> dict[str, Any] | None:
        data = payload.model_dump(mode="json", exclude_unset=True)
        response = execute_query(
            lambda: self.supabase.table("profiles").update(data).eq("id", str(user_id)).execute(),
            "Failed to update profile",
        )
        return first_or_none(response.data)
