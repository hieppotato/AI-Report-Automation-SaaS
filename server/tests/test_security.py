from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from uuid import uuid4

import jwt
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

TEST_JWT_SECRET = "test-secret-for-local-verification"


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
        TEST_JWT_SECRET,
        algorithm="HS256",
    )


def test_missing_bearer_token_returns_401() -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401


@patch("app.core.security._fetch_jwks")
def test_valid_supabase_jwt_returns_current_user(mock_fetch_jwks) -> None:
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.serialization import (
        Encoding,
        NoEncryption,
        PrivateFormat,
    )

    private_key = ec.generate_private_key(ec.SECP256R1())
    jwk_private = private_key.private_numbers()
    public_key = private_key.public_key()

    from cryptography.hazmat.primitives.asymmetric.utils import (
        encode_dss_signature,
    )
    from cryptography.hazmat.primitives.serialization import (
        Encoding,
        NoEncryption,
        PrivateFormat,
        PublicFormat,
    )

    pub_numbers = public_key.public_numbers()

    import base64

    def _b64url(n: int, length: int = 32) -> str:
        return base64.urlsafe_b64encode(n.to_bytes(length, "big")).rstrip(b"=").decode()

    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "x": _b64url(pub_numbers.x),
        "y": _b64url(pub_numbers.y),
        "kid": "test-key-1",
        "alg": "ES256",
        "key_ops": ["verify"],
    }

    mock_fetch_jwks.return_value = {"keys": [jwk]}

    now = datetime.now(tz=timezone.utc)
    payload = {
        "sub": str(uuid4()),
        "email": "user@example.com",
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=15)).timestamp()),
    }
    token = jwt.encode(payload, private_key, algorithm="ES256", headers={"kid": "test-key-1"})

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["id"] == payload["sub"]
