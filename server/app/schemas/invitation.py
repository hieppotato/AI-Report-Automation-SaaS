from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

InvitationStatus = Literal["pending", "accepted", "revoked", "expired"]
InvitationRole = Literal["admin", "member"]


class InvitationCreate(BaseModel):
    email: str = Field(..., max_length=320)
    role: InvitationRole = "member"

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if not email or "@" not in email:
            raise ValueError("Enter a valid email address.")
        return email


class InvitationAccept(BaseModel):
    token: str = Field(..., min_length=16, max_length=256)


class InvitationResponse(BaseModel):
    id: UUID
    organization_id: UUID
    email: str
    role: InvitationRole
    token: str
    status: InvitationStatus
    expires_at: datetime
    created_at: datetime
    accept_url: str | None = None
