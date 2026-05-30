from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

UploadStatus = Literal["uploaded", "processing", "completed", "failed"]


def _clean_required_text(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Value cannot be empty.")
    return cleaned


class UploadCreate(BaseModel):
    file_name: str = Field(..., max_length=255)
    file_path: str = Field(..., max_length=1024)
    mime_type: str | None = Field(default=None, max_length=255)
    size_bytes: int = Field(..., ge=0)
    status: UploadStatus = "uploaded"

    @field_validator("file_name", "file_path", mode="before")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        return _clean_required_text(value)

    @field_validator("mime_type", mode="before")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class UploadResponse(BaseModel):
    id: UUID
    organization_id: UUID
    uploaded_by: UUID
    file_name: str
    file_path: str | None = None
    file_url: str | None = None
    mime_type: str | None = None
    size_bytes: int
    status: UploadStatus
    created_at: datetime
    updated_at: datetime | None = None
