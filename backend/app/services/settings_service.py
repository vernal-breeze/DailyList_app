from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.settings import SettingsModel
from app.schemas.settings import SettingsUpdate


class SettingsService:
    """Business logic for application settings."""

    @staticmethod
    def _ensure_row(db: Session) -> SettingsModel:
        """Ensure the single settings row exists, creating it if necessary."""
        settings = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
        if not settings:
            settings = SettingsModel(id=1)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings

    @staticmethod
    def get_settings(db: Session) -> SettingsModel:
        """Return the application settings, creating defaults if needed."""
        return SettingsService._ensure_row(db)

    @staticmethod
    def update_settings(db: Session, update_data: SettingsUpdate) -> SettingsModel:
        """Update application settings. Only provided fields are changed."""
        settings = SettingsService._ensure_row(db)

        update_fields = update_data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(settings, field, value)

        settings.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(settings)
        return settings
