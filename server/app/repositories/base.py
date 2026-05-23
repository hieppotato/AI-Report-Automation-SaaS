from collections.abc import Callable
from typing import Any, TypeVar

from postgrest.exceptions import APIError

from app.core.exceptions import RepositoryError

T = TypeVar("T")


def execute_query(action: Callable[[], T], message: str = "Database operation failed.") -> T:
    try:
        return action()
    except APIError as exc:
        raise RepositoryError(f"{message}: {exc.message}") from exc
    except Exception as exc:
        raise RepositoryError(message) from exc


def first_or_none(rows: list[dict[str, Any]] | None) -> dict[str, Any] | None:
    if not rows:
        return None
    return rows[0]
