from datetime import datetime, date
from typing import List, Optional, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


# ---------------------------------------------------------------------------
# Recurrence nested schema (matches frontend format)
# ---------------------------------------------------------------------------

RecurrenceEndType = Literal["never", "after", "on"]
RecurrenceType = Literal["daily", "weekly", "monthly", "yearly", "custom"]
TaskPriority = Literal["low", "medium", "high"]
TaskType = Literal["single", "recurring"]


class RecurrenceEnd(BaseModel):
    type: RecurrenceEndType = "never"
    count: Optional[int] = None
    date: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class RecurrenceSchema(BaseModel):
    enabled: bool = False
    type: RecurrenceType = "daily"
    interval: int = Field(default=1, ge=1)
    days: List[int] = []
    end: RecurrenceEnd = Field(default_factory=RecurrenceEnd)
    exceptions: List[str] = []

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


# ---------------------------------------------------------------------------
# SubTask schemas
# ---------------------------------------------------------------------------

class SubTaskBase(BaseModel):
    title: str
    completed: bool = False
    level: int = 0
    sort_order: int = 0
    parent_id: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class SubTaskCreate(SubTaskBase):
    id: Optional[str] = None
    subtasks: Optional[List["SubTaskCreate"]] = None


class SubTaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    level: Optional[int] = None
    sort_order: Optional[int] = None
    parent_id: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class SubTaskResponse(BaseModel):
    id: str
    title: str
    completed: bool = False
    parent_id: Optional[str] = None
    level: int = 0
    subtasks: List["SubTaskResponse"] = []

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


# ---------------------------------------------------------------------------
# Task schemas
# ---------------------------------------------------------------------------

class TaskCreate(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = ""
    due_date: Optional[str] = None
    priority: TaskPriority = "medium"
    completed: bool = False
    category: Optional[str] = ""
    start_date: Optional[str] = None
    task_type: TaskType = "single"
    recurrence: Optional[RecurrenceSchema] = None
    reminder_enabled: bool = False
    notification_id: int = 0
    completed_dates: Optional[List[str]] = None
    subtasks: Optional[List[SubTaskCreate]] = None

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[TaskPriority] = None
    completed: Optional[bool] = None
    category: Optional[str] = None
    start_date: Optional[str] = None
    task_type: Optional[TaskType] = None
    recurrence: Optional[RecurrenceSchema] = None
    reminder_enabled: Optional[bool] = None
    notification_id: Optional[int] = None
    completed_dates: Optional[List[str]] = None
    version: Optional[int] = None

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = None
    priority: str = "medium"
    completed: bool = False
    created_at: str
    category: Optional[str] = ""
    start_date: Optional[str] = None
    task_type: str = "single"
    recurrence: RecurrenceSchema = Field(default_factory=RecurrenceSchema)
    reminder_enabled: bool = False
    notification_id: int = 0
    completed_dates: List[str] = []
    updated_at: str
    version: int
    subtasks: List[SubTaskResponse] = []

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )
