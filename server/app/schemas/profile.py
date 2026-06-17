from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


def _clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = Field(default=None, max_length=2048)
    company_name: str | None = Field(default=None, max_length=160)
    timezone: str | None = Field(default=None, max_length=80)

    @field_validator("full_name", "avatar_url", "company_name", "timezone", mode="before")
    @classmethod
    def clean_text(cls, value: str | None) -> str | None:
        return _clean_optional_text(value)


class ProfileResponse(BaseModel):
    id: UUID
    full_name: str | None = None
    avatar_url: str | None = None
    company_name: str | None = None
    timezone: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
