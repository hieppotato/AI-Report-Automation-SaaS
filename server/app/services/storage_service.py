from pathlib import Path
from time import time_ns
from uuid import UUID

from fastapi import UploadFile
from supabase import Client

from app.core.config import settings
from app.core.exceptions import AppError, RepositoryError


class StorageService:
    allowed_extensions = {".csv", ".xlsx", ".xls", ".pdf"}
    allowed_mime_types = {
        "text/csv",
        "application/csv",
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }

    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase
        self.bucket = settings.supabase_storage_bucket
        self.generated_bucket = settings.generated_reports_bucket

    async def _validate_and_read_upload(self, file: UploadFile) -> tuple[str, str, bytes]:
        file_name = file.filename or "upload"
        suffix = Path(file_name).suffix.lower()
        if suffix not in self.allowed_extensions and file.content_type not in self.allowed_mime_types:
            raise AppError("Unsupported file type.", status_code=415, code="unsupported_file_type")

        content = await file.read()
        if not content:
            raise AppError("Uploaded file is empty.", status_code=422, code="empty_file")

        safe_name = "".join(char if char.isalnum() or char in "._-" else "_" for char in file_name)
        return file_name, safe_name, content

    async def upload_organization_file(self, organization_id: UUID, file: UploadFile) -> dict:
        file_name, safe_name, content = await self._validate_and_read_upload(file)
        timestamp = time_ns() // 1_000_000
        file_path = f"{organization_id}/{timestamp}-{safe_name}"

        try:
            self.supabase.storage.from_(self.bucket).upload(
                file_path,
                content,
                {"content-type": file.content_type or "application/octet-stream", "upsert": "false"},
            )
        except Exception as exc:
            raise RepositoryError("Failed to upload file to Supabase Storage.") from exc

        return {
            "file_path": file_path,
            "file_name": file_name,
            "mime_type": file.content_type,
            "size_bytes": len(content),
        }

    async def upload_report_file(self, organization_id: UUID, report_id: UUID, file: UploadFile) -> dict:
        file_name, safe_name, content = await self._validate_and_read_upload(file)
        file_path = f"{organization_id}/reports/{report_id}/{safe_name}"

        try:
            self.supabase.storage.from_(self.bucket).upload(
                file_path,
                content,
                {"content-type": file.content_type or "application/octet-stream", "upsert": "true"},
            )
        except Exception as exc:
            raise RepositoryError("Failed to upload file to Supabase Storage.") from exc

        return {
            "file_path": file_path,
            "file_name": file_name,
            "mime_type": file.content_type,
            "size_bytes": len(content),
        }

    def download_file(self, file_path: str) -> bytes:
        try:
            data = self.supabase.storage.from_(self.bucket).download(file_path)
        except Exception as exc:
            raise RepositoryError("Failed to download file from Supabase Storage.") from exc

        if isinstance(data, bytes):
            return data
        if hasattr(data, "read"):
            return data.read()
        return bytes(data)

    def upload_generated_report(self, organization_id: UUID, report_id: UUID, file_name: str, content: bytes, content_type: str) -> dict:
        safe_name = "".join(char if char.isalnum() or char in "._-" else "_" for char in file_name)
        file_path = f"{organization_id}/reports/{report_id}/exports/{safe_name}"
        try:
            self.supabase.storage.from_(self.generated_bucket).upload(
                file_path,
                content,
                {"content-type": content_type, "upsert": "true"},
            )
        except Exception as exc:
            raise RepositoryError("Failed to upload generated report.") from exc
        return {"file_path": file_path, "bucket": self.generated_bucket}

    def create_signed_url(self, file_path: str, expires_in: int = 3600, bucket: str | None = None) -> str:
        try:
            response = self.supabase.storage.from_(bucket or self.bucket).create_signed_url(file_path, expires_in)
        except Exception as exc:
            raise RepositoryError("Failed to create file signed URL.") from exc
        return response.get("signedURL") or response.get("signed_url") or ""

    def delete_file(self, file_path: str, bucket: str | None = None) -> None:
        try:
            self.supabase.storage.from_(bucket or self.bucket).remove([file_path])
        except Exception as exc:
            raise RepositoryError("Failed to delete file from Supabase Storage.") from exc
