from datetime import datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ReportStatus = Literal["draft", "uploading", "processing", "completed", "failed"]


class ReportBase(BaseModel):
    """Internal base used for responses and pipeline updates only."""

    title: str | None = Field(default=None, max_length=180)
    description: str | None = Field(default=None, max_length=2000)
    status: ReportStatus | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    current_step: str | None = Field(default=None, max_length=120)
    file_url: str | None = Field(default=None, max_length=2048)
    file_name: str | None = Field(default=None, max_length=255)
    file_type: str | None = Field(default=None, max_length=120)
    report_json: dict[str, Any] | None = None
    error_message: str | None = None
    upload_id: UUID | None = None
    total_revenue: Decimal | None = Field(default=None, ge=0)
    total_orders: int | None = Field(default=None, ge=0)
    aov: Decimal | None = Field(default=None, ge=0)
    repeat_rate: Decimal | None = Field(default=None, ge=0)
    insights: dict[str, Any] | list[Any] | None = None
    anomalies: dict[str, Any] | list[Any] | None = None
    charts: dict[str, Any] | list[Any] | None = None


class ReportCreate(BaseModel):
    """User-facing create schema accepts only title and description."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=2000)


class ReportUpdate(BaseModel):
    """User-facing update schema accepts only title and description."""

    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=2000)


class ReportResponse(ReportBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime | None = None


class ReportSummaryResponse(BaseModel):
    total_reports: int
    latest_report_date: datetime | None = None
    total_revenue: Decimal
    total_orders: int
    avg_order_value: Decimal
    repeat_customer_rate: Decimal


class ReportStatusResponse(BaseModel):
    id: UUID
    status: ReportStatus
    progress: int
    current_step: str | None = None
    error: str | None = None
