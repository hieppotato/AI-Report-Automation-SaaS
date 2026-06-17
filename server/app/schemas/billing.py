from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

PlanName = Literal["free", "pro"]


class CheckoutCreate(BaseModel):
    organization_id: UUID


class CheckoutResponse(BaseModel):
    checkout_url: str


class CurrentPlanResponse(BaseModel):
    organization_id: UUID
    plan: PlanName
    status: str | None = None
    renewal_at: datetime | None = None
    provider: str = "lemonsqueezy"
