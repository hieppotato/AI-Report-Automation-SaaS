import logging

from app.core.config import settings


def configure_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format='{"level":"%(levelname)s","time":"%(asctime)s","module":"%(name)s","message":"%(message)s"}',
    )
