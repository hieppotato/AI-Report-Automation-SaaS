import json
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest

from fastapi.testclient import TestClient

from app.api.deps import get_billing_service, get_current_user, get_export_service, get_organization_service
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
    def create_checkout_session(self, organization_id: UUID, user_id: UUID):
        return {"checkout_url": "https://checkout.stripe.test/session", "session_id": "cs_test_123"}

    def current_plan(self, organization_id: UUID, user_id: UUID):
        return {
            "organization_id": organization_id,
            "plan": "free",
            "subscription_status": None,
            "current_period_end": None,
        }

    def handle_webhook(self, payload: bytes, signature: str | None):
        if signature != "valid":
            raise AppError("Invalid Stripe webhook signature.", status_code=400, code="invalid_webhook_signature")
        return {"received": True}


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


def test_billing_webhook_rejects_invalid_signature() -> None:
    setup_route_overrides()
    client = TestClient(app)
    response = client.post("/api/billing/webhook", content=b"{}", headers={"Stripe-Signature": "invalid"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_webhook_signature"


def test_member_cannot_create_checkout_session() -> None:
    service = BillingService(FakeBillingRepo(), FakeOrganizationRepo(role="member"))
    with pytest.raises(PermissionDeniedError):
        service.create_checkout_session(ORG_ID, USER_ID)


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
