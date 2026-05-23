from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import jwt
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

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


def verify_supabase_jwt(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            settings.jwt_verification_secret,
            algorithms=["HS256"],
            audience=settings.supabase_jwt_audience,
            options={"require": ["sub", "exp"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidAudienceError:
        try:
            return jwt.decode(
                token,
                settings.jwt_verification_secret,
                algorithms=["HS256"],
                options={"require": ["sub", "exp"], "verify_aud": False},
            )
        except jwt.InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def current_user_from_token(token: str) -> CurrentUser:
    payload = verify_supabase_jwt(token)
    subject = payload.get("sub")
    try:
        user_id = UUID(str(subject))
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject is not a valid user id.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    return CurrentUser(
        id=user_id,
        email=payload.get("email"),
        role=payload.get("role"),
        aud=payload.get("aud"),
        exp=expires_at,
        raw_claims=payload,
    )
