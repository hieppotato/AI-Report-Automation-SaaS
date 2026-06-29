import time
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any
from uuid import UUID

import httpx
import jwt
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from supabase import Client

from app.core.config import settings
from app.schemas.auth import CurrentUser


def extract_bearer_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def _unauthorized(message: str = "Invalid authentication token.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _decode_without_verification(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except jwt.InvalidTokenError:
        return {}


@lru_cache(maxsize=1)
def _fetch_jwks() -> dict[str, Any]:
    try:
        resp = httpx.get(settings.supabase_jwks_url, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return {"keys": []}


def _get_signing_key(jwks: dict[str, Any], token: str) -> Any:
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    alg = unverified_header.get("alg", "ES256")

    for key_data in jwks.get("keys", []):
        if kid and key_data.get("kid") == kid:
            return jwt.algorithms.ECAlgorithm.from_jwk(key_data)

    raise _unauthorized("Unable to find matching signing key.")


def verify_supabase_jwt_locally(token: str) -> dict[str, Any]:
    jwks = _fetch_jwks()
    if not jwks.get("keys"):
        raise _unauthorized("No signing keys available.")

    try:
        signing_key = _get_signing_key(jwks, token)
    except HTTPException:
        raise
    except Exception as exc:
        raise _unauthorized("Failed to resolve signing key.") from exc

    try:
        return jwt.decode(
            token,
            signing_key,
            algorithms=["ES256", "RS256"],
            audience=settings.supabase_jwt_audience,
            options={"require": ["sub", "exp"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise _unauthorized("Token has expired.") from exc
    except jwt.InvalidAudienceError:
        try:
            return jwt.decode(
                token,
                signing_key,
                algorithms=["ES256", "RS256"],
                options={"require": ["sub", "exp"], "verify_aud": False},
            )
        except jwt.InvalidTokenError as exc:
            raise _unauthorized() from exc
    except jwt.InvalidTokenError as exc:
        raise _unauthorized() from exc


def verify_supabase_token_with_auth(token: str, supabase: Client) -> dict[str, Any]:
    try:
        response = supabase.auth.get_user(token)
        user = response.user
    except Exception as exc:
        raise _unauthorized() from exc

    if not user or not user.id:
        raise _unauthorized()

    payload = _decode_without_verification(token)
    payload["sub"] = str(user.id)
    payload["email"] = user.email or payload.get("email")
    payload.setdefault("role", payload.get("role"))
    payload.setdefault("aud", payload.get("aud"))
    payload.setdefault("exp", int(datetime.now(tz=timezone.utc).timestamp()) + 3600)
    return payload


def current_user_from_token(token: str, supabase: Client | None = None) -> CurrentUser:
    try:
        payload = verify_supabase_jwt_locally(token)
    except HTTPException:
        if supabase is None:
            raise
        payload = verify_supabase_token_with_auth(token, supabase)

    subject = payload.get("sub")
    try:
        user_id = UUID(str(subject))
    except (TypeError, ValueError) as exc:
        raise _unauthorized("Token subject is not a valid user id.") from exc

    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    return CurrentUser(
        id=user_id,
        email=payload.get("email"),
        role=payload.get("role"),
        aud=payload.get("aud"),
        exp=expires_at,
        raw_claims=payload,
    )
