import json
import uuid
from datetime import datetime, date, timezone
from typing import List, Optional

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Date,
    JSON, ForeignKey, Index
)
from sqlalchemy.orm import relationship

from app.database import Base


class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    due_date = Column(Date, nullable=True)
    priority = Column(String(20), nullable=False, default="medium")
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    category = Column(String(100), nullable=True, default="")
    start_date = Column(Date, nullable=True)
    task_type = Column(String(50), nullable=False, default="normal")
    recurrence_type = Column(String(20), nullable=True)
    recurrence_interval = Column(Integer, nullable=True)
    recurrence_end_date = Column(Date, nullable=True)
    recurrence_days = Column(JSON, nullable=True, default=list)
    recurrence_exceptions = Column(JSON, nullable=True, default=list)
    reminder_enabled = Column(Boolean, nullable=False, default=False)
    completed_dates = Column(JSON, nullable=True, default=list)
    updated_at = Column(DateTime, nullable=False, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    version = Column(Integer, nullable=False, default=1)
    notification_id = Column(Integer, nullable=False, default=0)

    subtasks = relationship(
        "SubTaskModel",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # --- JSON column helpers ---

    def get_recurrence_days(self) -> List:
        if self.recurrence_days is None:
            return []
        if isinstance(self.recurrence_days, list):
            return self.recurrence_days
        if isinstance(self.recurrence_days, str):
            try:
                return json.loads(self.recurrence_days)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    def set_recurrence_days(self, value: Optional[List]) -> None:
        self.recurrence_days = value if value is not None else []

    def get_recurrence_exceptions(self) -> List[str]:
        if self.recurrence_exceptions is None:
            return []
        if isinstance(self.recurrence_exceptions, list):
            return self.recurrence_exceptions
        if isinstance(self.recurrence_exceptions, str):
            try:
                return json.loads(self.recurrence_exceptions)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    def set_recurrence_exceptions(self, value: Optional[List[str]]) -> None:
        self.recurrence_exceptions = value if value is not None else []

    def get_completed_dates(self) -> List[str]:
        if self.completed_dates is None:
            return []
        if isinstance(self.completed_dates, list):
            return self.completed_dates
        if isinstance(self.completed_dates, str):
            try:
                return json.loads(self.completed_dates)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    def set_completed_dates(self, value: Optional[List[str]]) -> None:
        self.completed_dates = value if value is not None else []

    def increment_version(self) -> None:
        self.version = (self.version or 0) + 1

    # 数据库索引：优化常用查询字段的检索性能
    __table_args__ = (
        Index('idx_tasks_completed', 'completed'),
        Index('idx_tasks_due_date', 'due_date'),
        Index('idx_tasks_priority', 'priority'),
        Index('idx_tasks_created_at', 'created_at'),
        Index('idx_tasks_task_type', 'task_type'),
    )
