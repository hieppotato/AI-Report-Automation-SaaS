import hashlib
import hmac
import json
import logging
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

logger = logging.getLogger(__name__)


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
        is_test_mode = settings.app_env == "development"
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
                    "test_mode": is_test_mode,
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
        except httpx.HTTPError as exc:
            raise AppError(f"Network error calling LemonSqueezy: {exc}", status_code=502, code="billing_provider_error") from exc

        if response.status_code >= 400:
            error_detail = response.text
            try:
                error_body = response.json()
                errors = error_body.get("errors") or []
                if errors:
                    error_detail = "; ".join(e.get("detail", str(e)) for e in errors)
            except Exception:
                pass
            raise AppError(
                f"LemonSqueezy API error ({response.status_code}): {error_detail}",
                status_code=502,
                code="billing_provider_error",
            )

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
        plan_from_db = "pro" if (organization.get("plan") or "").lower() == "pro" else "free"

        if plan_from_db == "free" and subscription and subscription.get("stripe_subscription_id"):
            self._sync_subscription_from_provider(organization_id, subscription)

        subscription = self.billing_repo.get_subscription(organization_id)
        if subscription:
            renewal_at = self._parse_timestamp(subscription.get("renewal_at") or subscription.get("current_period_end"))
            plan_from_db = "pro" if (organization.get("plan") or "").lower() == "pro" else "free"

        return CurrentPlanResponse(
            organization_id=organization_id,
            plan=plan_from_db,
            status=subscription.get("status") if subscription else None,
            renewal_at=renewal_at,
            provider=(subscription.get("provider") if subscription else None) or "lemonsqueezy",
        )

    def _sync_subscription_from_provider(self, organization_id: UUID, subscription: dict[str, Any]) -> None:
        external_id = subscription.get("stripe_subscription_id")
        if not external_id or not settings.lemonsqueezy_configured:
            return
        try:
            response = httpx.get(
                f"https://api.lemonsqueezy.com/v1/subscriptions/{external_id}",
                headers={
                    "Authorization": f"Bearer {settings.lemonsqueezy_api_key}",
                    "Accept": "application/vnd.api+json",
                },
                timeout=15,
            )
            if response.status_code != 200:
                return
            data = response.json().get("data") or {}
            attrs = data.get("attributes") or {}
            status = attrs.get("status") or "inactive"
            is_active = status in {"active", "on_trial"}
            plan = "pro" if is_active else "free"
            renewal_at = attrs.get("renews_at") or attrs.get("ends_at")

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
        except Exception:
            pass

    def get_current_plan_for_user(self, organization_id: UUID, user_id: UUID) -> CurrentPlanResponse:
        self._require_membership(organization_id, user_id)
        return self.get_current_plan(organization_id)

    def get_customer_portal_url(self, organization_id: UUID, user_id: UUID) -> str:
        self._require_membership(organization_id, user_id)
        subscription = self.billing_repo.get_subscription(organization_id)
        if not subscription or subscription.get("plan") != "pro":
            raise AppError("No active Pro subscription found.", status_code=404, code="no_active_subscription")
        external_id = subscription.get("stripe_subscription_id")
        if not external_id:
            raise AppError("Subscription ID not found. Please contact support.", status_code=404, code="subscription_id_missing")
        self._require_lemonsqueezy_config()

        logger.info("Fetching customer portal URL for subscription %s (org=%s)", external_id, organization_id)

        sub_attrs = self._fetch_subscription_attrs(external_id)
        portal_url = (sub_attrs.get("urls") or {}).get("customer_portal")

        if not portal_url:
            portal_url = self._fallback_customer_portal(sub_attrs)

        if not portal_url:
            logger.error("Portal URL not available for subscription %s. attrs=%s", external_id, sub_attrs)
            raise AppError("Customer portal URL not available.", status_code=502, code="billing_provider_error")

        return portal_url

    def _fetch_subscription_attrs(self, external_id: str) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {settings.lemonsqueezy_api_key}",
            "Accept": "application/vnd.api+json",
        }
        try:
            response = httpx.get(
                f"https://api.lemonsqueezy.com/v1/subscriptions/{external_id}",
                headers=headers,
                timeout=20,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            body = exc.response.text
            logger.error(
                "LemonSqueezy API %d for subscription %s: %s",
                status, external_id, body,
            )
            if status == 404:
                raise AppError(
                    "Subscription not found on billing provider.",
                    status_code=502, code="billing_provider_error",
                ) from exc
            raise AppError(
                "Failed to retrieve subscription details.",
                status_code=502, code="billing_provider_error",
            ) from exc
        except httpx.TimeoutException as exc:
            logger.error("Timeout fetching subscription %s", external_id)
            raise AppError(
                "Billing provider timed out. Please try again.",
                status_code=502, code="billing_provider_error",
            ) from exc
        except httpx.HTTPError as exc:
            logger.error("Failed to fetch subscription %s: %s", external_id, str(exc))
            raise AppError(
                "Failed to retrieve subscription details.",
                status_code=502, code="billing_provider_error",
            ) from exc

        sub_data = response.json()
        return (sub_data.get("data") or {}).get("attributes") or {}

    def _fallback_customer_portal(self, sub_attrs: dict[str, Any]) -> str | None:
        customer_id = sub_attrs.get("customer_id")
        if not customer_id:
            return None
        logger.info("Falling back to customer API for portal URL (customer_id=%s)", customer_id)
        try:
            response = httpx.get(
                f"https://api.lemonsqueezy.com/v1/customers/{customer_id}",
                headers={
                    "Authorization": f"Bearer {settings.lemonsqueezy_api_key}",
                    "Accept": "application/vnd.api+json",
                },
                timeout=20,
            )
            response.raise_for_status()
            cust_data = response.json()
            portal_url = ((cust_data.get("data") or {}).get("attributes") or {}).get("urls", {}).get("customer_portal")
            if portal_url:
                logger.info("Got portal URL from customer endpoint for customer_id=%s", customer_id)
                return portal_url
        except httpx.HTTPError as exc:
            logger.error("Failed to fetch customer %s for portal URL: %s", customer_id, str(exc))
        return None

    def process_webhook(self, payload: bytes, signature: str | None) -> dict[str, Any]:
        self._require_lemonsqueezy_config()
        self._verify_signature(payload, signature)
        event = json.loads(payload.decode("utf-8"))
        meta = event.get("meta") or {}
        event_name = meta.get("event_name")
        data = event.get("data") or {}
        attributes = data.get("attributes") or {}

        custom_data = meta.get("custom_data") or {}
        organization_id = custom_data.get("organization_id")
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
        elif event_name == "subscription_paused":
            renewal_at = attributes.get("renews_at") or attributes.get("ends_at")
            self._update_subscription(UUID(str(organization_id)), "free", "paused", renewal_at, data)
        elif event_name == "subscription_resumed":
            renewal_at = attributes.get("renews_at") or attributes.get("trial_ends_at")
            self._update_subscription(UUID(str(organization_id)), "pro", "active", renewal_at, data)
        return {"received": True}

    def _update_subscription(self, organization_id: UUID, plan: str, status: str, renewal_at: Any, data: dict[str, Any]) -> None:
        external_id = data.get("id")
        self.billing_repo.upsert_subscription(
            organization_id,
            {
                "provider": "lemonsqueezy",
                "plan": plan,
                "status": status,
                "renewal_at": renewal_at,
                "current_period_end": renewal_at,
                "stripe_subscription_id": str(external_id) if external_id else None,
            },
        )
        self.billing_repo.update_organization_plan(organization_id, plan)
        if self.audit_service:
            event_type = "billing.upgraded" if plan == "pro" else "billing.downgraded"
            self.audit_service.log_event(
                organization_id,
                None,
                event_type,
                "subscription",
                str(external_id or ""),
                {"provider": "lemonsqueezy", "status": status, "plan": plan},
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
