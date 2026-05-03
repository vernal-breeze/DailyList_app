import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from sqlalchemy.orm import Session

from app.models.task import TaskModel
from app.models.subtask import SubTaskModel
from app.services.recurrence_utils import parse_date, parse_recurrence_data


class MigrationService:
    """Business logic for data migration from localStorage."""

    @staticmethod
    def import_from_localstorage(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Import tasks and settings from a localStorage export.

        Expected data format (frontend camelCase):
        {
            "tasks": [{
                "id": "uuid-string",
                "title": "...",
                "dueDate": "2025-01-15",
                "startDate": "2025-01-10",
                "taskType": "single" | "recurring",
                "recurrence": {
                    "enabled": true,
                    "type": "daily",
                    "interval": 1,
                    "days": [1, 3],
                    "end": {"type": "never"},
                    "exceptions": []
                },
                "reminderEnabled": false,
                "completedDates": [],
                "subtasks": [{...}]
            }],
            "settings": {...}
        }
        """
        imported_tasks = 0
        imported_subtasks = 0
        errors: List[str] = []

        tasks_data = data.get("tasks", [])
        settings_data = data.get("settings")

        for task_dict in tasks_data:
            try:
                # 从嵌套的 recurrence 对象中提取数据库字段
                recurrence = task_dict.get("recurrence", {})
                recurrence_data = parse_recurrence_data(recurrence)

                task = TaskModel(
                    id=task_dict.get("id") or str(uuid.uuid4()),
                    title=task_dict.get("title", "Untitled"),
                    description=task_dict.get("description", ""),
                    due_date=parse_date(task_dict.get("dueDate")),
                    priority=task_dict.get("priority", "medium"),
                    completed=task_dict.get("completed", False),
                    category=task_dict.get("category", ""),
                    start_date=parse_date(task_dict.get("startDate")),
                    task_type=task_dict.get("taskType", "single"),
                    recurrence_type=recurrence_data["recurrence_type"],
                    recurrence_interval=recurrence_data["recurrence_interval"],
                    recurrence_end_date=recurrence_data["recurrence_end_date"],
                    reminder_enabled=task_dict.get("reminderEnabled", False),
                    notification_id=task_dict.get("notificationId", 0),
                    version=1,
                )
                task.set_recurrence_days(recurrence_data["recurrence_days"])
                task.set_recurrence_exceptions(recurrence_data["recurrence_exceptions"])
                task.set_completed_dates(task_dict.get("completedDates"))

                # Handle created_at from migration data
                created_at = task_dict.get("createdAt")
                if created_at:
                    task.created_at = _parse_datetime(created_at) or datetime.now(timezone.utc)

                db.add(task)
                db.flush()

                # Recursively import subtasks
                subtasks_data = task_dict.get("subtasks", [])
                sub_count = MigrationService._import_subtasks_recursive(
                    db, task.id, None, subtasks_data, 0
                )
                imported_subtasks += sub_count
                imported_tasks += 1

            except Exception as e:
                errors.append(f"Task '{task_dict.get('title', '?')}': {str(e)}")

        # Import settings if present
        if settings_data:
            try:
                from app.models.settings import SettingsModel
                existing = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
                if existing:
                    if "theme" in settings_data:
                        existing.theme = settings_data["theme"]
                    if "sortBy" in settings_data:
                        existing.sort_by = settings_data["sortBy"]
                    if "showCompleted" in settings_data:
                        existing.show_completed = settings_data["showCompleted"]
                    existing.updated_at = datetime.now(timezone.utc)
                else:
                    settings = SettingsModel(
                        id=1,
                        theme=settings_data.get("theme", "light"),
                        sort_by=settings_data.get("sortBy", "dueDate"),
                        show_completed=settings_data.get("showCompleted", True),
                    )
                    db.add(settings)
            except Exception as e:
                errors.append(f"Settings: {str(e)}")

        db.commit()

        return {
            "imported_tasks": imported_tasks,
            "imported_subtasks": imported_subtasks,
            "errors": errors,
            "total_errors": len(errors),
        }

    @staticmethod
    def _import_subtasks_recursive(
        db: Session,
        task_id: str,
        parent_id: Optional[str],
        subtasks_data: List[Dict[str, Any]],
        level: int,
    ) -> int:
        """Recursively import subtasks, returning the count of imported subtasks."""
        count = 0
        for idx, sub_dict in enumerate(subtasks_data):
            try:
                subtask = SubTaskModel(
                    id=sub_dict.get("id") or str(uuid.uuid4()),
                    task_id=task_id,
                    parent_id=parent_id,
                    title=sub_dict.get("title", "Untitled"),
                    completed=sub_dict.get("completed", False),
                    level=level,
                    sort_order=sub_dict.get("sortOrder", idx),
                )
                db.add(subtask)
                db.flush()
                count += 1

                # Recurse into nested children
                children = sub_dict.get("subtasks", [])
                if children:
                    count += MigrationService._import_subtasks_recursive(
                        db, task_id, subtask.id, children, level + 1
                    )
            except Exception:
                pass  # skip problematic subtasks
        return count

    @staticmethod
    def get_status(db: Session) -> Dict[str, Any]:
        """Return migration status information."""
        task_count = db.query(TaskModel).count()
        from app.models.subtask import SubTaskModel
        subtask_count = db.query(SubTaskModel).count()

        return {
            "tasks_count": task_count,
            "subtasks_count": subtask_count,
            "database_ready": True,
        }


def _parse_datetime(value: Any) -> Optional[datetime]:
    """Parse a datetime value from migration data."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None
    return None
