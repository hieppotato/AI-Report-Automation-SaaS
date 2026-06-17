from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_profile_service
from app.main import app
from app.schemas.auth import CurrentUser


USER_ID = uuid4()


def now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


class FakeProfileService:
    def get_profile(self, user_id: UUID) -> dict:
        return {
            "id": str(user_id),
            "full_name": "Jane Doe",
            "avatar_url": None,
            "company_name": "Acme",
            "timezone": "Asia/Bangkok",
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }

    def update_profile(self, user_id: UUID, payload) -> dict:
        return {
            "id": str(user_id),
            "full_name": payload.full_name,
            "avatar_url": payload.avatar_url,
            "company_name": payload.company_name,
            "timezone": payload.timezone,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }


def fake_current_user() -> CurrentUser:
    exp = datetime.now(tz=timezone.utc) + timedelta(minutes=15)
    return CurrentUser(id=USER_ID, email="user@example.com", role="authenticated", aud="authenticated", exp=exp)


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_get_my_profile() -> None:
    app.dependency_overrides[get_current_user] = fake_current_user
    app.dependency_overrides[get_profile_service] = lambda: FakeProfileService()
    client = TestClient(app)
    response = client.get("/api/profile/me")
    assert response.status_code == 200
    assert response.json()["id"] == str(USER_ID)


def test_patch_my_profile_sanitizes_input() -> None:
    app.dependency_overrides[get_current_user] = fake_current_user
    app.dependency_overrides[get_profile_service] = lambda: FakeProfileService()
    client = TestClient(app)
    response = client.patch(
        "/api/profile/me",
        json={
            "full_name": " Jane Doe ",
            "avatar_url": " https://example.com/avatar.png ",
            "company_name": " Acme ",
            "timezone": " Asia/Bangkok ",
        },
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Jane Doe"
    assert response.json()["company_name"] == "Acme"
