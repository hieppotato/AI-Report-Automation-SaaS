from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

OrganizationRole = Literal["owner", "admin", "member"]


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    slug: str | None = Field(default=None, min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    plan: str = Field(default="free", max_length=40)


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str | None = None
    owner_id: UUID
    plan: str
    created_at: datetime
    updated_at: datetime | None = None


class AddOrganizationMemberRequest(BaseModel):
    user_id: UUID | None = None
    email: str | None = Field(default=None, max_length=320)
    role: OrganizationRole = "member"

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        return normalized or None

    @model_validator(mode="after")
    def require_user_id_or_email(self) -> "AddOrganizationMemberRequest":
        if not self.user_id and not self.email:
            raise ValueError("Either user_id or email is required.")
        if self.email and "@" not in self.email:
            raise ValueError("Enter a valid email address.")
        return self


class OrganizationMemberUpdate(BaseModel):
    role: OrganizationRole


class OrganizationMemberResponse(BaseModel):
    id: UUID
    organization_id: UUID
    user_id: UUID
    role: OrganizationRole
    created_at: datetime
    updated_at: datetime | None = None
