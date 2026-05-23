from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

OrganizationRole = Literal["owner", "admin", "member"]


class CurrentUser(BaseModel):
    id: UUID
    email: str | None = None
    role: str | None = None
    aud: str | None = None
    exp: datetime
    raw_claims: dict[str, Any] = Field(default_factory=dict, exclude=True)


class OrganizationContext(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    organization_id: UUID
    user_id: UUID
    role: OrganizationRole
    organization: dict[str, Any]
    membership: dict[str, Any]
