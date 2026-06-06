from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

PlanName = Literal["free", "pro"]


class CheckoutSessionCreate(BaseModel):
    organization_id: UUID


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


class CurrentPlanResponse(BaseModel):
    organization_id: UUID
    plan: PlanName
    subscription_status: str | None = None
    current_period_end: datetime | None = None
