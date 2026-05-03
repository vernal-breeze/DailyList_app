from typing import List, TYPE_CHECKING

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.task import TaskModel


class SubTaskModel(Base):
    __tablename__ = "subtasks"

    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(String, ForeignKey("subtasks.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    completed = Column(Boolean, nullable=False, default=False)
    level = Column(Integer, nullable=False, default=0)
    sort_order = Column(Integer, nullable=False, default=0)

    task = relationship("TaskModel", back_populates="subtasks")
    parent = relationship(
        "SubTaskModel",
        back_populates="children",
        remote_side="SubTaskModel.id",
        foreign_keys=[parent_id],
    )
    children = relationship(
        "SubTaskModel",
        back_populates="parent",
        foreign_keys=[parent_id],
        cascade="all, delete-orphan",
        lazy="selectin",
        join_depth=5,
    )
