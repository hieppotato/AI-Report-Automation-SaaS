from typing import Any
from uuid import UUID

from supabase import Client

from app.core.exceptions import RepositoryError
from app.repositories.base import execute_query, first_or_none, response_count
from app.schemas.upload import UploadCreate


class UploadRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def _upload_insert_candidates(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        candidates: list[dict[str, Any]] = [dict(data)]
        seen: set[tuple[tuple[str, Any], ...]] = {tuple(data.items())}

        def add_candidate(candidate: dict[str, Any]) -> None:
            key = tuple(candidate.items())
            if key not in seen:
                seen.add(key)
                candidates.append(candidate)

        if data.get("file_path"):
            legacy_path = dict(data)
            legacy_path["file_url"] = legacy_path.pop("file_path")
            add_candidate(legacy_path)

        if "mime_type" in data:
            legacy_mime = {key: value for key, value in data.items() if key != "mime_type"}
            if data.get("mime_type"):
                legacy_mime["file_type"] = data["mime_type"]
            add_candidate(legacy_mime)

            if data.get("file_path"):
                legacy_both = dict(legacy_mime)
                legacy_both["file_url"] = legacy_both.pop("file_path")
                add_candidate(legacy_both)

        return candidates

    def create_upload(self, organization_id: UUID, uploaded_by: UUID, payload: UploadCreate) -> dict[str, Any]:
        data = payload.model_dump(mode="json")
        data["organization_id"] = str(organization_id)
        data["uploaded_by"] = str(uploaded_by)

        last_error: RepositoryError | None = None
        for candidate in self._upload_insert_candidates(data):
            try:
                response = execute_query(
                    lambda candidate=candidate: self.supabase.table("uploads").insert(candidate).execute(),
                    "Failed to create upload metadata",
                )
                return response.data[0]
            except RepositoryError as exc:
                last_error = exc

        if last_error:
            raise last_error
        raise RepositoryError("Failed to create upload metadata")

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
