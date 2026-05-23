from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, organizations, reports
from app.core.config import settings
from app.middleware.error_handler import register_exception_handlers


def create_app() -> FastAPI:
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

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(organizations.router, prefix="/api/organizations", tags=["organizations"])
    app.include_router(reports.router, prefix="/api/organizations", tags=["reports"])

    return app


app = create_app()
