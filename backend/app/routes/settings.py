from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.settings import SettingsUpdate
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _settings_to_dict(settings) -> dict:
    """Convert a SettingsModel to a camelCase dict matching frontend format."""
    return {
        "id": settings.id,
        "theme": settings.theme,
        "sortBy": settings.sort_by,
        "showCompleted": settings.show_completed,
        "updatedAt": settings.updated_at.isoformat() if settings.updated_at else None,
    }


@router.get("", response_model=ApiResponse)
def get_settings(db: Session = Depends(get_db)):
    """Get application settings."""
    settings = SettingsService.get_settings(db)
    return ApiResponse.ok(
        data=_settings_to_dict(settings),
        message="Settings retrieved successfully",
    )


@router.put("", response_model=ApiResponse)
def update_settings(update_data: SettingsUpdate, db: Session = Depends(get_db)):
    """Update application settings. Only provided fields will be changed."""
    settings = SettingsService.update_settings(db, update_data)
    return ApiResponse.ok(
        data=_settings_to_dict(settings),
        message="Settings updated successfully",
    )
