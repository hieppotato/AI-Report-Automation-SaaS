from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import jwt
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_organization_service, get_report_service
from app.main import app
from app.schemas.auth import CurrentUser


ORG_ID = uuid4()
REPORT_ID = uuid4()
USER_ID = uuid4()
OTHER_USER_ID = uuid4()


def now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


class FakeOrganizationService:
    def __init__(self, role: str | None = "member") -> None:
        self.role = role

    def list_user_organizations(self, user_id: UUID) -> list[dict]:
        return [self.get_organization(ORG_ID)]

    def get_organization(self, organization_id: UUID) -> dict | None:
        if organization_id != ORG_ID:
            return None
        return {
            "id": str(ORG_ID),
            "name": "Acme",
            "slug": "acme",
            "owner_id": str(USER_ID),
            "plan": "free",
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }

    def get_membership(self, organization_id: UUID, user_id: UUID) -> dict | None:
        if organization_id == ORG_ID and user_id == USER_ID and self.role:
            return {
                "id": str(uuid4()),
                "organization_id": str(ORG_ID),
                "user_id": str(USER_ID),
                "role": self.role,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            }
        return None

    def list_members(self, organization_id: UUID) -> list[dict]:
        return [self.get_membership(organization_id, USER_ID)]

    def add_member(self, organization_id: UUID, payload) -> dict:
        return {
            "id": str(uuid4()),
            "organization_id": str(organization_id),
            "user_id": str(payload.user_id),
            "role": payload.role,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }

    def remove_member(self, organization_id: UUID, user_id: UUID, requester_role: str, requester_id: UUID) -> None:
        return None


class FakeReportService:
    def __init__(self) -> None:
        self.last_org_id: UUID | None = None

    def list_reports(self, organization_id: UUID) -> list[dict]:
        self.last_org_id = organization_id
        return [self._report(organization_id)]

    def get_report(self, organization_id: UUID, report_id: UUID) -> dict:
        self.last_org_id = organization_id
        return self._report(organization_id, report_id)

    def create_report(self, organization_id: UUID, payload) -> dict:
        return self._report(organization_id)

    def update_report(self, organization_id: UUID, report_id: UUID, payload) -> dict:
        return self._report(organization_id, report_id)

    def delete_report(self, organization_id: UUID, report_id: UUID) -> None:
        self.last_org_id = organization_id

    def _report(self, organization_id: UUID, report_id: UUID = REPORT_ID) -> dict:
        return {
            "id": str(report_id),
            "organization_id": str(organization_id),
            "upload_id": None,
            "total_revenue": "100.00",
            "total_orders": 10,
            "aov": "10.00",
            "repeat_rate": "0.20",
            "insights": {},
            "anomalies": {},
            "charts": {},
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }


def fake_current_user() -> CurrentUser:
    exp = datetime.now(tz=timezone.utc) + timedelta(minutes=15)
    return CurrentUser(id=USER_ID, email="user@example.com", role="authenticated", aud="authenticated", exp=exp)


def make_token(user_id: str | None = None) -> str:
    now = datetime.now(tz=timezone.utc)
    return jwt.encode(
        {
            "sub": user_id or str(USER_ID),
            "aud": "authenticated",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=15)).timestamp()),
        },
        "test-secret",
        algorithm="HS256",
    )


def setup_overrides(role: str | None = "member", report_service: FakeReportService | None = None) -> None:
    app.dependency_overrides[get_current_user] = fake_current_user
    app.dependency_overrides[get_organization_service] = lambda: FakeOrganizationService(role)
    app.dependency_overrides[get_report_service] = lambda: report_service or FakeReportService()


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_non_member_cannot_access_org() -> None:
    setup_overrides(role=None)
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}")
    assert response.status_code == 404


def test_member_can_read_org_reports() -> None:
    setup_overrides(role="member")
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/reports")
    assert response.status_code == 200
    assert response.json()[0]["organization_id"] == str(ORG_ID)


def test_admin_can_add_member() -> None:
    setup_overrides(role="admin")
    client = TestClient(app)
    response = client.post(
        f"/api/organizations/{ORG_ID}/members",
        json={"user_id": str(OTHER_USER_ID), "role": "member"},
    )
    assert response.status_code == 201


def test_member_cannot_add_member() -> None:
    setup_overrides(role="member")
    client = TestClient(app)
    response = client.post(
        f"/api/organizations/{ORG_ID}/members",
        json={"user_id": str(OTHER_USER_ID), "role": "member"},
    )
    assert response.status_code == 403


def test_report_routes_use_path_organization_scope() -> None:
    report_service = FakeReportService()
    setup_overrides(role="member", report_service=report_service)
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/reports/{REPORT_ID}")
    assert response.status_code == 200
    assert report_service.last_org_id == ORG_ID
