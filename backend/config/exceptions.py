from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, detail: str, code: str | None = None, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code or "error"


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource", resource_id: str | None = None):
        detail = f"{resource} not found" + (f": {resource_id}" if resource_id else "")
        super().__init__(detail=detail, code="not_found", status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(detail=detail, code="unauthorized", status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(detail=detail, code="forbidden", status_code=status.HTTP_403_FORBIDDEN)


class ConflictException(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, code="conflict", status_code=status.HTTP_409_CONFLICT)


class ValidationException(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, code="validation_error", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)
