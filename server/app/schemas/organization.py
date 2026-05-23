from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

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
    user_id: UUID
    role: OrganizationRole = "member"


class OrganizationMemberUpdate(BaseModel):
    role: OrganizationRole


class OrganizationMemberResponse(BaseModel):
    id: UUID
    organization_id: UUID
    user_id: UUID
    role: OrganizationRole
    created_at: datetime
    updated_at: datetime | None = None
