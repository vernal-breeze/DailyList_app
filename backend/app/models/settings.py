from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, DateTime, CheckConstraint

from app.database import Base


class SettingsModel(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, default=1)
    theme = Column(String(50), nullable=False, default="light")
    sort_by = Column(String(50), nullable=False, default="dueDate")
    show_completed = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("id = 1", name="settings_single_row"),
    )
