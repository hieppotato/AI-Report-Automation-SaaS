from typing import Any
from uuid import UUID

from supabase import Client

from app.core.exceptions import RepositoryError
from app.repositories.base import execute_query, first_or_none, response_count
from app.schemas.upload import UploadCreate


class UploadRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def create_upload(self, organization_id: UUID, uploaded_by: UUID, payload: UploadCreate) -> dict[str, Any]:
        data = payload.model_dump(mode="json")
        data["organization_id"] = str(organization_id)
        data["uploaded_by"] = str(uploaded_by)
        try:
            response = execute_query(
                lambda: self.supabase.table("uploads").insert(data).execute(),
                "Failed to create upload metadata",
            )
        except RepositoryError as exc:
            if "file_path" not in exc.message:
                raise
            fallback = {**data, "file_url": data["file_path"]}
            fallback.pop("file_path", None)
            response = execute_query(
                lambda: self.supabase.table("uploads").insert(fallback).execute(),
                "Failed to create upload metadata",
            )
        return response.data[0]

    def list_uploads(self, organization_id: UUID, limit: int, offset: int) -> tuple[list[dict[str, Any]], int]:
        response = execute_query(
            lambda: self.supabase.table("uploads")
            .select("*", count="exact")
            .eq("organization_id", str(organization_id))
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute(),
            "Failed to list uploads",
        )
        return response.data or [], response_count(response)

    def get_upload_by_id(self, organization_id: UUID, upload_id: UUID) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("uploads")
            .select("*")
            .eq("organization_id", str(organization_id))
            .eq("id", str(upload_id))
            .limit(1)
            .execute(),
            "Failed to fetch upload metadata",
        )
        return first_or_none(response.data)
