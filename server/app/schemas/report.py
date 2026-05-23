from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ReportBase(BaseModel):
    upload_id: UUID | None = None
    total_revenue: Decimal | None = Field(default=None, ge=0)
    total_orders: int | None = Field(default=None, ge=0)
    aov: Decimal | None = Field(default=None, ge=0)
    repeat_rate: Decimal | None = Field(default=None, ge=0)
    insights: dict[str, Any] | list[Any] | None = None
    anomalies: dict[str, Any] | list[Any] | None = None
    charts: dict[str, Any] | list[Any] | None = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(ReportBase):
    pass


class ReportResponse(ReportBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime | None = None
