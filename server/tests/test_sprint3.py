import json
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest

from fastapi.testclient import TestClient

from app.api.deps import (
    get_audit_service,
    get_billing_service,
    get_current_user,
    get_export_service,
    get_organization_service,
    get_usage_service,
)
from app.core.exceptions import AppError, PermissionDeniedError
from app.main import app
from app.schemas.auth import CurrentUser
from app.schemas.export import ReportExportResponse
from app.services.ai_pipeline import AIPipelineService
from app.services.billing_service import BillingService


ORG_ID = uuid4()
REPORT_ID = uuid4()
USER_ID = uuid4()


def fake_current_user() -> CurrentUser:
    exp = datetime.now(tz=timezone.utc) + timedelta(minutes=15)
    return CurrentUser(id=USER_ID, email="owner@example.com", role="authenticated", aud="authenticated", exp=exp)


class FakeOrganizationService:
    def __init__(self, role: str | None = "owner") -> None:
        self.role = role

    def get_organization(self, organization_id: UUID) -> dict | None:
        if organization_id != ORG_ID:
            return None
        return {
            "id": str(ORG_ID),
            "name": "Acme",
            "slug": "acme",
            "owner_id": str(USER_ID),
            "plan": "free",
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
            "updated_at": None,
        }

    def get_membership(self, organization_id: UUID, user_id: UUID) -> dict | None:
        if organization_id == ORG_ID and user_id == USER_ID and self.role:
            return {"organization_id": str(ORG_ID), "user_id": str(USER_ID), "role": self.role}
        return None


class FakeExportService:
    def export_report(self, organization_id: UUID, report_id: UUID, export_format: str):
        return ReportExportResponse(
            format=export_format,
            file_path=f"{organization_id}/reports/{report_id}/exports/report.{export_format}",
            signed_url="https://signed.example/report",
            expires_in=3600,
        )


class FakeBillingRouteService:
    def create_checkout_for_user(self, organization_id: UUID, user_id: UUID, user_email: str | None):
        return {"checkout_url": "https://checkout.lemonsqueezy.test/session"}

    def get_current_plan_for_user(self, organization_id: UUID, user_id: UUID):
        return {
            "organization_id": organization_id,
            "plan": "free",
            "status": None,
            "renewal_at": None,
            "provider": "lemonsqueezy",
        }

    def process_webhook(self, payload: bytes, signature: str | None):
        if signature != "valid":
            raise AppError("Invalid LemonSqueezy webhook signature.", status_code=400, code="invalid_webhook_signature")
        return {"received": True}


class FakeUsageService:
    def enforce_export_format(self, organization_id: UUID, export_format: str) -> None:
        return None


class FakeAuditService:
    def log_event(self, *args, **kwargs) -> None:
        return None


class FakeBillingRepo:
    def __init__(self) -> None:
        self.subscription = None
        self.updated_plan = None

    def get_subscription(self, organization_id: UUID):
        return self.subscription

    def upsert_subscription(self, organization_id: UUID, fields: dict):
        self.subscription = {"organization_id": str(organization_id), **fields}
        return self.subscription

    def update_organization_plan(self, organization_id: UUID, plan: str):
        self.updated_plan = plan
        return {"id": str(organization_id), "plan": plan}


class FakeOrganizationRepo:
    def __init__(self, role: str = "owner") -> None:
        self.role = role

    def get_by_id(self, organization_id: UUID):
        return {"id": str(organization_id), "plan": "free"}

    def get_membership(self, organization_id: UUID, user_id: UUID):
        return {"organization_id": str(organization_id), "user_id": str(user_id), "role": self.role}


class FakeHttpResponse:
    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return {"data": {"attributes": {"url": "https://checkout.lemonsqueezy.test/real"}}}


class DummyReportRepo:
    def __init__(self) -> None:
        self.updated = []

    def get_report_by_id(self, organization_id: UUID, report_id: UUID):
        return {
            "id": str(report_id),
            "organization_id": str(organization_id),
            "file_url": "path/orders.csv",
            "file_name": "orders.csv",
            "file_type": "text/csv",
        }

    def update_report_fields(self, organization_id: UUID, report_id: UUID, fields: dict):
        self.updated.append(fields)
        return fields


class DummyStorage:
    def download_file(self, file_path: str) -> bytes:
        return b"date,revenue,orders\n2026-01-01,100,2\n"


class DummyParser:
    def parse(self, content: bytes, file_name: str, mime_type: str | None):
        return "parsed business data"


def setup_route_overrides(role: str | None = "owner") -> None:
    app.dependency_overrides[get_current_user] = fake_current_user
    app.dependency_overrides[get_organization_service] = lambda: FakeOrganizationService(role)
    app.dependency_overrides[get_export_service] = lambda: FakeExportService()
    app.dependency_overrides[get_billing_service] = lambda: FakeBillingRouteService()
    app.dependency_overrides[get_usage_service] = lambda: FakeUsageService()
    app.dependency_overrides[get_audit_service] = lambda: FakeAuditService()


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_pdf_export_requires_membership_and_returns_signed_url() -> None:
    setup_route_overrides(role="member")
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/reports/{REPORT_ID}/export/pdf")
    assert response.status_code == 200
    assert response.json()["format"] == "pdf"
    assert response.json()["signed_url"]


def test_docx_export_requires_membership_and_returns_signed_url() -> None:
    setup_route_overrides(role="member")
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/reports/{REPORT_ID}/export/docx")
    assert response.status_code == 200
    assert response.json()["format"] == "docx"


def test_export_fails_for_cross_org_report() -> None:
    setup_route_overrides(role=None)
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/reports/{REPORT_ID}/export/pdf")
    assert response.status_code == 404


def test_billing_current_plan_defaults_to_free() -> None:
    setup_route_overrides(role="member")
    client = TestClient(app)
    response = client.get(f"/api/billing/current-plan?organization_id={ORG_ID}")
    assert response.status_code == 200
    assert response.json()["plan"] == "free"
    assert response.json()["provider"] == "lemonsqueezy"


def test_checkout_creation_returns_lemonsqueezy_url() -> None:
    setup_route_overrides(role="admin")
    client = TestClient(app)
    response = client.post("/api/billing/create-checkout", json={"organization_id": str(ORG_ID)})
    assert response.status_code == 200
    assert response.json() == {"checkout_url": "https://checkout.lemonsqueezy.test/session"}


def test_billing_webhook_rejects_invalid_signature() -> None:
    setup_route_overrides()
    client = TestClient(app)
    response = client.post("/api/billing/webhook", content=b"{}", headers={"X-Signature": "invalid"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_webhook_signature"


def test_member_cannot_create_checkout() -> None:
    service = BillingService(FakeBillingRepo(), FakeOrganizationRepo(role="member"))
    with pytest.raises(PermissionDeniedError):
        service.create_checkout_for_user(ORG_ID, USER_ID, "member@example.com")


def test_admin_checkout_creation_calls_lemonsqueezy(monkeypatch) -> None:
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_api_key", "test-key", raising=False)
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_store_id", "1", raising=False)
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_variant_id", "2", raising=False)
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_webhook_secret", "secret", raising=False)
    captured = {}

    def fake_post(url, headers, json, timeout):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = timeout
        return FakeHttpResponse()

    monkeypatch.setattr("app.services.billing_service.httpx.post", fake_post)
    service = BillingService(FakeBillingRepo(), FakeOrganizationRepo(role="admin"))
    response = service.create_checkout_for_user(ORG_ID, USER_ID, "admin@example.com")
    assert response.checkout_url == "https://checkout.lemonsqueezy.test/real"
    assert captured["url"] == "https://api.lemonsqueezy.com/v1/checkouts"
    assert captured["json"]["data"]["relationships"]["variant"]["data"]["id"] == "2"
    assert captured["json"]["data"]["attributes"]["checkout_data"]["custom"]["organization_id"] == str(ORG_ID)


def test_lemonsqueezy_webhook_updates_plan(monkeypatch) -> None:
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_api_key", "test-key", raising=False)
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_store_id", "1", raising=False)
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_variant_id", "2", raising=False)
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_webhook_secret", "secret", raising=False)
    repo = FakeBillingRepo()
    service = BillingService(repo, FakeOrganizationRepo(role="owner"))
    payload = json.dumps(
        {
            "meta": {"event_name": "subscription_created", "custom_data": {"organization_id": str(ORG_ID)}},
            "data": {
                "id": "sub_123",
                "attributes": {
                    "status": "active",
                    "renews_at": "2026-07-01T00:00:00Z",
                    "customer_id": 123,
                    "variant_id": 456,
                },
            },
        }
    ).encode("utf-8")
    signature = hmac.new(b"secret", payload, hashlib.sha256).hexdigest()
    result = service.process_webhook(payload, signature)
    assert result == {"received": True}
    assert repo.updated_plan == "pro"
    assert repo.subscription["provider"] == "lemonsqueezy"
    assert repo.subscription["renewal_at"] == "2026-07-01T00:00:00Z"


def test_lemonsqueezy_cancelled_webhook_sets_free(monkeypatch) -> None:
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_api_key", "test-key", raising=False)
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_store_id", "1", raising=False)
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_variant_id", "2", raising=False)
    monkeypatch.setattr("app.services.billing_service.settings.lemonsqueezy_webhook_secret", "secret", raising=False)
    repo = FakeBillingRepo()
    service = BillingService(repo, FakeOrganizationRepo(role="owner"))
    payload = json.dumps(
        {
            "meta": {"event_name": "subscription_cancelled", "custom_data": {"organization_id": str(ORG_ID)}},
            "data": {"id": "sub_123", "attributes": {"status": "cancelled", "ends_at": "2026-07-01T00:00:00Z"}},
        }
    ).encode("utf-8")
    signature = hmac.new(b"secret", payload, hashlib.sha256).hexdigest()
    service.process_webhook(payload, signature)
    assert repo.updated_plan == "free"
    assert repo.subscription["plan"] == "free"


def test_gemini_json_recovery_and_retry(monkeypatch) -> None:
    repo = DummyReportRepo()
    service = AIPipelineService(repo, DummyStorage(), parser=DummyParser())
    calls = {"count": 0}

    def fake_call(system_prompt: str, text: str) -> str:
        calls["count"] += 1
        if calls["count"] == 1:
            return "not json"
        return "```json\n" + json.dumps(
            {
                "executive_summary": "Strong revenue month.",
                "key_trends": ["Revenue increased"],
                "risks": [],
                "opportunities": [],
                "recommendations": ["Invest in retention"],
                "insights": ["Good momentum"],
                "anomalies": ["One spike"],
                "charts": [],
                "metrics": [{"key": "total_revenue", "value": 100}],
            }
        ) + "\n```"

    monkeypatch.setattr(service, "_call_gemini", fake_call)
    report_json = service.generate_report_json("source data")
    assert calls["count"] == 2
    assert report_json["executive_summary"] == "Strong revenue month."
    assert report_json["summary"] == "Strong revenue month."


def test_pipeline_failure_marks_report_failed(monkeypatch) -> None:
    repo = DummyReportRepo()
    service = AIPipelineService(repo, DummyStorage(), parser=DummyParser())
    monkeypatch.setattr(service, "generate_report_json", lambda text: (_ for _ in ()).throw(RuntimeError("Gemini down")))
    service.run_report_pipeline(ORG_ID, REPORT_ID)
    assert repo.updated[-1]["status"] == "failed"
    assert repo.updated[-1]["error_message"] == "Gemini down"
