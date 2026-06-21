from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class AuditEventResponse(BaseModel):
    id: UUID
    organization_id: UUID
    actor_id: UUID | None = None
    action: str
    target_type: str
    target_id: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime
