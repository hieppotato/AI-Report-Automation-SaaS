from fastapi import status


class AppError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found.") -> None:
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class PermissionDeniedError(AppError):
    def __init__(self, message: str = "You do not have permission to perform this action.") -> None:
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class RepositoryError(AppError):
    def __init__(self, message: str = "Database operation failed.") -> None:
        super().__init__(message, status.HTTP_502_BAD_GATEWAY)


class ConflictError(AppError):
    def __init__(self, message: str = "Resource conflict.") -> None:
        super().__init__(message, status.HTTP_409_CONFLICT)
