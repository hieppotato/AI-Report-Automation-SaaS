import logging
from datetime import datetime
from typing import Any
from uuid import UUID

from app.repositories.audit_repo import AuditRepository
from app.schemas.pagination import PaginatedResponse, PaginationParams

logger = logging.getLogger(__name__)


class AuditService:
    def __init__(self, repo: AuditRepository) -> None:
        self.repo = repo

    def log_event(
        self,
        organization_id: UUID,
        actor_id: UUID | None,
        action: str,
        target_type: str,
        target_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        try:
            self.repo.create_event(organization_id, actor_id, action, target_type, target_id, metadata)
        except Exception as exc:
            logger.warning("Failed to write audit event action=%s org=%s error=%s", action, organization_id, exc)

    def list_events(
        self,
        organization_id: UUID,
        pagination: PaginationParams,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        actor_id: UUID | None = None,
        action: str | None = None,
    ) -> PaginatedResponse[dict]:
        items, total = self.repo.list_events(
            organization_id,
            pagination.limit,
            pagination.offset,
            date_from=date_from,
            date_to=date_to,
            actor_id=actor_id,
            action=action,
        )
        return PaginatedResponse(items=items, total=total, limit=pagination.limit, offset=pagination.offset)
