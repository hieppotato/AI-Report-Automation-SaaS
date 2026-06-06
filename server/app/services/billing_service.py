from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from app.core.config import settings
from app.core.exceptions import AppError, NotFoundError, PermissionDeniedError
from app.repositories.billing_repo import BillingRepository
from app.repositories.organization_repo import OrganizationRepository
from app.schemas.billing import CheckoutSessionResponse, CurrentPlanResponse


class BillingService:
    def __init__(self, billing_repo: BillingRepository, organization_repo: OrganizationRepository) -> None:
        self.billing_repo = billing_repo
        self.organization_repo = organization_repo

    def create_checkout_session(self, organization_id: UUID, user_id: UUID) -> CheckoutSessionResponse:
        membership = self._require_membership(organization_id, user_id)
        if membership["role"] not in {"owner", "admin"}:
            raise PermissionDeniedError("Organization admin access is required.")
        self._require_stripe_config()

        import stripe

        stripe.api_key = settings.stripe_secret_key
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
            success_url=f"{settings.app_frontend_url.rstrip('/')}/billing?checkout=success",
            cancel_url=f"{settings.app_frontend_url.rstrip('/')}/billing?checkout=cancelled",
            client_reference_id=str(organization_id),
            metadata={"organization_id": str(organization_id), "plan": "pro"},
        )
        return CheckoutSessionResponse(checkout_url=session.url, session_id=session.id)

    def current_plan(self, organization_id: UUID, user_id: UUID) -> CurrentPlanResponse:
        self._require_membership(organization_id, user_id)
        organization = self.organization_repo.get_by_id(organization_id)
        if not organization:
            raise NotFoundError("Organization not found.")
        subscription = self.billing_repo.get_subscription(organization_id)
        return CurrentPlanResponse(
            organization_id=organization_id,
            plan="pro" if (organization.get("plan") or "").lower() == "pro" else "free",
            subscription_status=subscription.get("status") if subscription else None,
            current_period_end=self._parse_timestamp(subscription.get("current_period_end")) if subscription else None,
        )

    def handle_webhook(self, payload: bytes, signature: str | None) -> dict[str, Any]:
        self._require_stripe_config()
        if not signature:
            raise AppError("Missing Stripe webhook signature.", status_code=400, code="invalid_webhook_signature")

        import stripe

        try:
            event = stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)
        except Exception as exc:
            raise AppError("Invalid Stripe webhook signature.", status_code=400, code="invalid_webhook_signature") from exc

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            organization_id = session.get("client_reference_id") or (session.get("metadata") or {}).get("organization_id")
            if organization_id:
                self._mark_pro_subscription(UUID(str(organization_id)), session)
        return {"received": True}

    def _mark_pro_subscription(self, organization_id: UUID, session: Any) -> None:
        self.billing_repo.upsert_subscription(
            organization_id,
            {
                "plan": "pro",
                "status": "active",
                "stripe_customer_id": session.get("customer"),
                "stripe_subscription_id": session.get("subscription"),
                "stripe_checkout_session_id": session.get("id"),
                "stripe_price_id": settings.stripe_pro_price_id,
            },
        )
        self.billing_repo.update_organization_plan(organization_id, "pro")

    def _require_membership(self, organization_id: UUID, user_id: UUID) -> dict[str, Any]:
        organization = self.organization_repo.get_by_id(organization_id)
        membership = self.organization_repo.get_membership(organization_id, user_id)
        if not organization or not membership:
            raise NotFoundError("Organization not found.")
        return membership

    def _require_stripe_config(self) -> None:
        if not settings.stripe_secret_key or not settings.stripe_webhook_secret or not settings.stripe_pro_price_id:
            raise AppError("Stripe billing is not configured.", status_code=503, code="billing_not_configured")

    def _parse_timestamp(self, value: Any) -> datetime | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, tz=timezone.utc)
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None
