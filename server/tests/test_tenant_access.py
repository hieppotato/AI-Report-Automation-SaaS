from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import jwt
from fastapi.testclient import TestClient

from app.api.deps import (
    get_current_user,
    get_organization_service,
    get_report_repository,
    get_report_service,
    get_storage_service,
    get_upload_repository,
    get_upload_service,
)
from app.main import app
from app.schemas.auth import CurrentUser
from app.schemas.pagination import PaginatedResponse
from app.schemas.report import ReportSummaryResponse


ORG_ID = uuid4()
REPORT_ID = uuid4()
USER_ID = uuid4()
OTHER_USER_ID = uuid4()
MEMBER_ID = uuid4()
UPLOAD_ID = uuid4()


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

    def list_members(self, organization_id: UUID, pagination=None):
        items = [self.get_membership(organization_id, USER_ID)]
        if pagination is None:
            return items
        return PaginatedResponse(items=items, total=1, limit=pagination.limit, offset=pagination.offset)

    def add_member(self, organization_id: UUID, payload) -> dict:
        return {
            "id": str(uuid4()),
            "organization_id": str(organization_id),
            "user_id": str(payload.user_id or OTHER_USER_ID),
            "role": payload.role,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }

    def remove_member(self, organization_id: UUID, user_id: UUID, requester_role: str, requester_id: UUID) -> None:
        return None

    def update_member_role(self, organization_id: UUID, member_id: UUID, payload, requester_id: UUID) -> dict:
        return {
            "id": str(member_id),
            "organization_id": str(organization_id),
            "user_id": str(OTHER_USER_ID),
            "role": payload.role,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }


class FakeReportService:
    def __init__(self) -> None:
        self.last_org_id: UUID | None = None

    def list_reports(self, organization_id: UUID, pagination) -> PaginatedResponse[dict]:
        self.last_org_id = organization_id
        return PaginatedResponse(
            items=[self._report(organization_id)],
            total=1,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    def get_report(self, organization_id: UUID, report_id: UUID) -> dict:
        self.last_org_id = organization_id
        return self._report(organization_id, report_id)

    def create_report(self, organization_id: UUID, payload) -> dict:
        return self._report(organization_id)

    def update_report(self, organization_id: UUID, report_id: UUID, payload) -> dict:
        return self._report(organization_id, report_id)

    def delete_report(self, organization_id: UUID, report_id: UUID) -> None:
        self.last_org_id = organization_id

    def get_status(self, organization_id: UUID, report_id: UUID):
        self.last_org_id = organization_id
        return {
            "id": str(report_id),
            "status": "processing",
            "progress": 30,
            "current_step": "File parsed",
            "error": None,
        }

    def get_summary(self, organization_id: UUID) -> ReportSummaryResponse:
        self.last_org_id = organization_id
        return ReportSummaryResponse(
            total_reports=1,
            latest_report_date=datetime.now(tz=timezone.utc),
            total_revenue="100.00",
            total_orders=10,
            avg_order_value="10.00",
            repeat_customer_rate="0.20",
        )

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
            "title": "Revenue report",
            "description": None,
            "status": "completed",
            "progress": 100,
            "current_step": "Completed",
            "file_url": None,
            "file_name": None,
            "file_type": None,
            "report_json": None,
            "error_message": None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }


class FakeReportRepository:
    def __init__(self) -> None:
        self.updated_fields = []

    def get_report_by_id(self, organization_id: UUID, report_id: UUID) -> dict:
        return FakeReportService()._report(organization_id, report_id)

    def update_report_fields(self, organization_id: UUID, report_id: UUID, fields: dict) -> dict:
        self.updated_fields.append(fields)
        report = FakeReportService()._report(organization_id, report_id)
        report.update(fields)
        return report

    def create_report_job(self, report_id: UUID, job_type: str) -> dict:
        return {
            "id": str(uuid4()),
            "report_id": str(report_id),
            "job_type": job_type,
            "status": "processing",
            "progress": 0,
        }

    def update_report_job(self, job_id: UUID, fields: dict) -> dict:
        return {"id": str(job_id), **fields}


class FakeUploadRepository:
    def create_upload(self, organization_id: UUID, uploaded_by: UUID, payload) -> dict:
        return {
            "id": str(UPLOAD_ID),
            "organization_id": str(organization_id),
            "uploaded_by": str(uploaded_by),
            "file_name": payload.file_name,
            "file_path": payload.file_path,
            "mime_type": payload.mime_type,
            "size_bytes": payload.size_bytes,
            "status": payload.status,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }


class FakeStorageService:
    async def upload_report_file(self, organization_id: UUID, report_id: UUID, file) -> dict:
        return {
            "file_path": f"{organization_id}/reports/{report_id}/orders.csv",
            "file_name": file.filename,
            "mime_type": file.content_type,
            "size_bytes": 32,
        }

    async def upload_organization_file(self, organization_id: UUID, file) -> dict:
        return {
            "file_path": f"{organization_id}/orders.csv",
            "file_name": file.filename,
            "mime_type": file.content_type,
            "size_bytes": 32,
        }

    def download_file(self, file_path: str) -> bytes:
        return b"date,revenue,orders\n2026-01-01,100,2\n"


class FakeUploadService:
    def __init__(self) -> None:
        self.last_org_id: UUID | None = None

    def create_upload(self, organization_id: UUID, uploaded_by: UUID, payload) -> dict:
        self.last_org_id = organization_id
        return self._upload(organization_id, uploaded_by)

    def list_uploads(self, organization_id: UUID, pagination) -> PaginatedResponse[dict]:
        self.last_org_id = organization_id
        return PaginatedResponse(
            items=[self._upload(organization_id, USER_ID)],
            total=1,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    def get_upload(self, organization_id: UUID, upload_id: UUID) -> dict:
        self.last_org_id = organization_id
        return self._upload(organization_id, USER_ID, upload_id)

    def _upload(self, organization_id: UUID, uploaded_by: UUID, upload_id: UUID = UPLOAD_ID) -> dict:
        return {
            "id": str(upload_id),
            "organization_id": str(organization_id),
            "uploaded_by": str(uploaded_by),
            "file_name": "orders.csv",
            "file_path": f"{organization_id}/orders.csv",
            "mime_type": "text/csv",
            "size_bytes": 128,
            "status": "uploaded",
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


def setup_overrides(
    role: str | None = "member",
    report_service: FakeReportService | None = None,
    upload_service: FakeUploadService | None = None,
    report_repo: FakeReportRepository | None = None,
) -> None:
    app.dependency_overrides[get_current_user] = fake_current_user
    app.dependency_overrides[get_organization_service] = lambda: FakeOrganizationService(role)
    app.dependency_overrides[get_report_service] = lambda: report_service or FakeReportService()
    app.dependency_overrides[get_upload_service] = lambda: upload_service or FakeUploadService()
    if report_repo is not None:
        app.dependency_overrides[get_report_repository] = lambda: report_repo
    app.dependency_overrides[get_upload_repository] = lambda: FakeUploadRepository()
    app.dependency_overrides[get_storage_service] = lambda: FakeStorageService()


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_non_member_cannot_access_org() -> None:
    setup_overrides(role=None)
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_member_can_read_org_reports() -> None:
    setup_overrides(role="member")
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/reports?limit=10&offset=0")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["limit"] == 10
    assert body["items"][0]["organization_id"] == str(ORG_ID)


def test_admin_can_add_member() -> None:
    setup_overrides(role="admin")
    client = TestClient(app)
    response = client.post(
        f"/api/organizations/{ORG_ID}/members",
        json={"user_id": str(OTHER_USER_ID), "role": "member"},
    )
    assert response.status_code == 201


def test_admin_can_add_member_by_email() -> None:
    setup_overrides(role="admin")
    client = TestClient(app)
    response = client.post(
        f"/api/organizations/{ORG_ID}/members",
        json={"email": "new.member@example.com", "role": "member"},
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
    assert response.json()["error"]["code"] == "forbidden"


def test_admin_can_update_member_role() -> None:
    setup_overrides(role="admin")
    client = TestClient(app)
    response = client.patch(
        f"/api/organizations/{ORG_ID}/members/{MEMBER_ID}",
        json={"role": "admin"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_report_summary_is_org_scoped() -> None:
    report_service = FakeReportService()
    setup_overrides(role="member", report_service=report_service)
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/reports/summary")
    assert response.status_code == 200
    assert response.json()["total_reports"] == 1
    assert report_service.last_org_id == ORG_ID


def test_report_status_is_org_scoped() -> None:
    report_service = FakeReportService()
    setup_overrides(role="member", report_service=report_service)
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/reports/{REPORT_ID}/status")
    assert response.status_code == 200
    assert response.json()["status"] == "processing"
    assert report_service.last_org_id == ORG_ID


def test_report_upload_queues_pipeline() -> None:
    report_repo = FakeReportRepository()
    setup_overrides(role="member", report_repo=report_repo)
    client = TestClient(app)
    response = client.post(
        f"/api/organizations/{ORG_ID}/reports/{REPORT_ID}/upload",
        files={"file": ("orders.csv", b"date,revenue,orders\n2026-01-01,100,2\n", "text/csv")},
    )
    assert response.status_code == 200
    assert response.json()["upload_id"] == str(UPLOAD_ID)
    assert any(
        fields.get("status") == "processing"
        and fields.get("current_step") == "Uploading file"
        and fields.get("file_name") == "orders.csv"
        for fields in report_repo.updated_fields
    )


def test_uploads_are_paginated_and_org_scoped() -> None:
    upload_service = FakeUploadService()
    setup_overrides(role="member", upload_service=upload_service)
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/uploads?limit=5&offset=0")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["limit"] == 5
    assert body["items"][0]["organization_id"] == str(ORG_ID)
    assert upload_service.last_org_id == ORG_ID


def test_create_upload_sets_current_user_as_uploader() -> None:
    upload_service = FakeUploadService()
    setup_overrides(role="member", upload_service=upload_service)
    client = TestClient(app)
    response = client.post(
        f"/api/organizations/{ORG_ID}/uploads",
        json={
            "file_name": " orders.csv ",
            "file_path": f"{ORG_ID}/orders.csv",
            "mime_type": "text/csv",
            "size_bytes": 128,
            "status": "uploaded",
        },
    )
    assert response.status_code == 201
    assert response.json()["uploaded_by"] == str(USER_ID)


def test_upload_file_creates_metadata_for_current_user() -> None:
    upload_service = FakeUploadService()
    setup_overrides(role="member", upload_service=upload_service)
    client = TestClient(app)
    response = client.post(
        f"/api/organizations/{ORG_ID}/uploads/file",
        files={"file": ("orders.csv", b"date,revenue\n2026-01-01,100", "text/csv")},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["uploaded_by"] == str(USER_ID)
    assert body["organization_id"] == str(ORG_ID)
    assert body["file_name"] == "orders.csv"
    assert upload_service.last_org_id == ORG_ID


def test_report_routes_use_path_organization_scope() -> None:
    report_service = FakeReportService()
    setup_overrides(role="member", report_service=report_service)
    client = TestClient(app)
    response = client.get(f"/api/organizations/{ORG_ID}/reports/{REPORT_ID}")
    assert response.status_code == 200
    assert report_service.last_org_id == ORG_ID
