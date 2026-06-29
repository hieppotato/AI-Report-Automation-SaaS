from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.supabase import get_supabase_admin
from app.schemas.auth import CurrentUser
from pydantic import BaseModel, EmailStr

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class RegisterResponse(BaseModel):
    id: str
    email: str
    message: str


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    supabase = get_supabase_admin()
    try:
        resp = supabase.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {"full_name": payload.full_name} if payload.full_name else {},
        })
        user = resp.user
        return RegisterResponse(
            id=str(user.id),
            email=str(user.email),
            message="Account created successfully.",
        )
    except HTTPException:
        raise
    except Exception as e:
        code = getattr(e, "code", "") or ""
        msg = str(e)
        if "already registered" in msg.lower() or "already exists" in msg.lower() or code == "email_exists":
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        raise HTTPException(status_code=502, detail=f"Registration failed: {msg}")


@router.get("/me", response_model=CurrentUser)
def read_current_user(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return current_user
