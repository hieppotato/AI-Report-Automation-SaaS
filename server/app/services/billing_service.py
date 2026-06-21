import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import httpx

from app.core.config import settings
from app.core.exceptions import AppError, NotFoundError, PermissionDeniedError
from app.repositories.billing_repo import BillingRepository
from app.repositories.organization_repo import OrganizationRepository
from app.schemas.billing import CheckoutResponse, CurrentPlanResponse
from app.services.audit_service import AuditService


class BillingService:
    def __init__(
        self,
        billing_repo: BillingRepository,
        organization_repo: OrganizationRepository,
        audit_service: AuditService | None = None,
    ) -> None:
        self.billing_repo = billing_repo
        self.organization_repo = organization_repo
        self.audit_service = audit_service

    def create_checkout_url(self, organization_id: UUID, user_email: str | None) -> CheckoutResponse:
        self._require_lemonsqueezy_config()
        payload = {
            "data": {
                "type": "checkouts",
                "attributes": {
                    "checkout_data": {
                        "email": user_email,
                        "custom": {"organization_id": str(organization_id)},
                    },
                    "product_options": {
                        "redirect_url": f"{settings.app_frontend_url.rstrip('/')}/billing?checkout=success",
                    },
                },
                "relationships": {
                    "store": {
                        "data": {"type": "stores", "id": str(settings.lemonsqueezy_store_id)},
                    },
                    "variant": {
                        "data": {"type": "variants", "id": str(settings.lemonsqueezy_variant_id)},
                    },
                },
            }
        }
        try:
            response = httpx.post(
                "https://api.lemonsqueezy.com/v1/checkouts",
                headers={
                    "Authorization": f"Bearer {settings.lemonsqueezy_api_key}",
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json",
                },
                json=payload,
                timeout=20,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise AppError("Failed to create LemonSqueezy checkout.", status_code=502, code="billing_provider_error") from exc

        checkout = response.json()
        checkout_url = ((checkout.get("data") or {}).get("attributes") or {}).get("url")
        if not checkout_url:
            raise AppError("LemonSqueezy checkout response did not include a URL.", status_code=502, code="billing_provider_error")
        return CheckoutResponse(checkout_url=checkout_url)

    def create_checkout_for_user(self, organization_id: UUID, user_id: UUID, user_email: str | None) -> CheckoutResponse:
        membership = self._require_membership(organization_id, user_id)
        if membership["role"] not in {"owner", "admin"}:
            raise PermissionDeniedError("Organization admin access is required.")
        return self.create_checkout_url(organization_id, user_email)

    def get_current_plan(self, organization_id: UUID) -> CurrentPlanResponse:
        organization = self.organization_repo.get_by_id(organization_id)
        if not organization:
            raise NotFoundError("Organization not found.")
        subscription = self.billing_repo.get_subscription(organization_id)
        renewal_at = None
        if subscription:
            renewal_at = self._parse_timestamp(subscription.get("renewal_at") or subscription.get("current_period_end"))
        return CurrentPlanResponse(
            organization_id=organization_id,
            plan="pro" if (organization.get("plan") or "").lower() == "pro" else "free",
            status=subscription.get("status") if subscription else None,
            renewal_at=renewal_at,
            provider=(subscription.get("provider") if subscription else None) or "lemonsqueezy",
        )

    def get_current_plan_for_user(self, organization_id: UUID, user_id: UUID) -> CurrentPlanResponse:
        self._require_membership(organization_id, user_id)
        return self.get_current_plan(organization_id)

    def process_webhook(self, payload: bytes, signature: str | None) -> dict[str, Any]:
        self._require_lemonsqueezy_config()
        self._verify_signature(payload, signature)
        event = json.loads(payload.decode("utf-8"))
        event_name = (event.get("meta") or {}).get("event_name")
        data = event.get("data") or {}
        attributes = data.get("attributes") or {}
        custom = (attributes.get("custom_data") or attributes.get("checkout_data") or {}).get("custom") or attributes.get("custom_data") or {}
        organization_id = custom.get("organization_id") or (event.get("meta") or {}).get("custom_data", {}).get("organization_id")
        if not organization_id:
            return {"received": True, "ignored": True}

        if event_name in {"subscription_created", "subscription_updated"}:
            status = attributes.get("status") or "active"
            is_active = status in {"active", "on_trial", "paused"}
            plan = "pro" if is_active else "free"
            renewal_at = attributes.get("renews_at") or attributes.get("trial_ends_at") or attributes.get("ends_at")
            self._update_subscription(UUID(str(organization_id)), plan, status, renewal_at, data)
        elif event_name == "subscription_cancelled":
            renewal_at = attributes.get("ends_at") or attributes.get("renews_at")
            self._update_subscription(UUID(str(organization_id)), "free", attributes.get("status") or "cancelled", renewal_at, data)
        return {"received": True}

    def _update_subscription(self, organization_id: UUID, plan: str, status: str, renewal_at: Any, data: dict[str, Any]) -> None:
        external_id = data.get("id")
        attributes = data.get("attributes") or {}
        self.billing_repo.upsert_subscription(
            organization_id,
            {
                "provider": "lemonsqueezy",
                "plan": plan,
                "status": status,
                "renewal_at": renewal_at,
                "current_period_end": renewal_at,
            },
        )
        self.billing_repo.update_organization_plan(organization_id, plan)
        if self.audit_service and plan == "pro":
            self.audit_service.log_event(
                organization_id,
                None,
                "billing.upgraded",
                "subscription",
                str(data.get("id") or ""),
                {"provider": "lemonsqueezy", "status": status},
            )

    def _verify_signature(self, payload: bytes, signature: str | None) -> None:
        if not signature:
            raise AppError("Missing LemonSqueezy webhook signature.", status_code=400, code="invalid_webhook_signature")
        digest = hmac.new(settings.lemonsqueezy_webhook_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(digest, signature):
            raise AppError("Invalid LemonSqueezy webhook signature.", status_code=400, code="invalid_webhook_signature")

    def _require_membership(self, organization_id: UUID, user_id: UUID) -> dict[str, Any]:
        organization = self.organization_repo.get_by_id(organization_id)
        membership = self.organization_repo.get_membership(organization_id, user_id)
        if not organization or not membership:
            raise NotFoundError("Organization not found.")
        return membership

    def _require_lemonsqueezy_config(self) -> None:
        if not settings.lemonsqueezy_configured:
            raise AppError("LemonSqueezy billing is not configured.", status_code=503, code="billing_not_configured")

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
