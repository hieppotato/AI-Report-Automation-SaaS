from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def make_token(user_id: str | None = None) -> str:
    now = datetime.now(tz=timezone.utc)
    return jwt.encode(
        {
            "sub": user_id or str(uuid4()),
            "email": "user@example.com",
            "aud": "authenticated",
            "role": "authenticated",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=15)).timestamp()),
        },
        "test-secret",
        algorithm="HS256",
    )


def test_missing_bearer_token_returns_401() -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_valid_supabase_jwt_returns_current_user() -> None:
    user_id = str(uuid4())
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {make_token(user_id)}"})
    assert response.status_code == 200
    assert response.json()["id"] == user_id
