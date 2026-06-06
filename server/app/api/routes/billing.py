from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request

from app.api.deps import get_billing_service, get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.billing import CheckoutSessionCreate, CheckoutSessionResponse, CurrentPlanResponse
from app.services.billing_service import BillingService

router = APIRouter()


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    payload: CheckoutSessionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    service: BillingService = Depends(get_billing_service),
) -> CheckoutSessionResponse:
    return service.create_checkout_session(payload.organization_id, current_user.id)


@router.get("/current-plan", response_model=CurrentPlanResponse)
def current_plan(
    organization_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: BillingService = Depends(get_billing_service),
) -> CurrentPlanResponse:
    return service.current_plan(organization_id, current_user.id)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    service: BillingService = Depends(get_billing_service),
) -> dict:
    payload = await request.body()
    return service.handle_webhook(payload, stripe_signature)
