from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Report Automation API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    port: int = 8000

    supabase_url: str = Field(..., alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(..., alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str | None = Field(None, alias="SUPABASE_JWT_SECRET")
    jwt_secret: str | None = Field(None, alias="JWT_SECRET")
    supabase_jwt_audience: str = Field("authenticated", alias="SUPABASE_JWT_AUDIENCE")
    supabase_storage_bucket: str = Field("raw-csv", alias="SUPABASE_STORAGE_BUCKET")
    google_gemini_api_key: str | None = Field(None, alias="GOOGLE_GEMINI_API_KEY")
    google_gemini_model: str = Field("gemini-2.5-flash-20240606", alias="GOOGLE_GEMINI_MODEL")

    backend_cors_origins: str | list[str] = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="BACKEND_CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str] | str:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def cors_origins(self) -> list[str]:
        if isinstance(self.backend_cors_origins, str):
            return [self.backend_cors_origins]
        return self.backend_cors_origins

    @property
    def jwt_verification_secret(self) -> str:
        secret = self.supabase_jwt_secret or self.jwt_secret
        if not secret:
            raise RuntimeError("SUPABASE_JWT_SECRET or JWT_SECRET must be configured.")
        return secret


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
