from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request

from app.api.deps import get_billing_service, get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.billing import CheckoutCreate, CheckoutResponse, CurrentPlanResponse
from app.services.billing_service import BillingService

router = APIRouter()


@router.post("/create-checkout", response_model=CheckoutResponse)
def create_checkout(
    payload: CheckoutCreate,
    current_user: CurrentUser = Depends(get_current_user),
    service: BillingService = Depends(get_billing_service),
) -> CheckoutResponse:
    return service.create_checkout_for_user(payload.organization_id, current_user.id, current_user.email)


@router.get("/current-plan", response_model=CurrentPlanResponse)
def current_plan(
    organization_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: BillingService = Depends(get_billing_service),
) -> CurrentPlanResponse:
    return service.get_current_plan_for_user(organization_id, current_user.id)


@router.post("/webhook")
async def lemonsqueezy_webhook(
    request: Request,
    lemon_signature: str | None = Header(default=None, alias="X-Signature"),
    service: BillingService = Depends(get_billing_service),
) -> dict:
    payload = await request.body()
    return service.process_webhook(payload, lemon_signature)
