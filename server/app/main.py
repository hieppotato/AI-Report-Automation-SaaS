from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, billing, exports, organizations, profile, reports, uploads
from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware.error_handler import register_exception_handlers


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok", "environment": settings.app_env}

    @app.get("/health/ready", tags=["health"])
    def readiness() -> dict:
        return {
            "status": "ready",
            "environment": settings.app_env,
            "checks": {
                "supabase_url": bool(settings.supabase_url),
                "supabase_service_role_key": bool(settings.supabase_service_role_key),
                "jwt_secret": bool(settings.supabase_jwt_secret or settings.jwt_secret),
                "source_storage_bucket": bool(settings.supabase_storage_bucket),
                "generated_reports_bucket": bool(settings.generated_reports_bucket),
                "gemini": bool(settings.google_gemini_api_key),
                "lemonsqueezy": settings.lemonsqueezy_configured,
            },
        }

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
    app.include_router(organizations.router, prefix="/api/organizations", tags=["organizations"])
    app.include_router(reports.router, prefix="/api/organizations", tags=["reports"])
    app.include_router(exports.router, prefix="/api/organizations", tags=["exports"])
    app.include_router(uploads.router, prefix="/api/organizations", tags=["uploads"])
    app.include_router(billing.router, prefix="/api/billing", tags=["billing"])

    return app


app = create_app()
