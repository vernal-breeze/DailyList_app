from typing import TypeVar, Generic, Optional, Any

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response wrapper."""

    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[str] = None
    code: int = 200

    @classmethod
    def ok(cls, data: Any = None, message: str = "success") -> "ApiResponse":
        return cls(success=True, data=data, message=message, code=200)

    @classmethod
    def fail(cls, message: str = "error", error: Optional[str] = None, code: int = 400) -> "ApiResponse":
        return cls(success=False, data=None, message=message, error=error, code=code)

    @classmethod
    def not_found(cls, message: str = "Resource not found") -> "ApiResponse":
        return cls(success=False, data=None, message=message, error="NOT_FOUND", code=404)

    @classmethod
    def conflict(cls, message: str = "Conflict") -> "ApiResponse":
        return cls(success=False, data=None, message=message, error="CONFLICT", code=409)
