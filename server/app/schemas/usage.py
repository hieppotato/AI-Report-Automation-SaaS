from typing import Literal

from pydantic import BaseModel

PlanName = Literal["free", "pro"]


class UsageCurrentResponse(BaseModel):
    plan: PlanName
    reports_used: int
    reports_limit: int | None
    storage_used_mb: float
    storage_limit_mb: int
