import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.task import TaskModel
from app.models.subtask import SubTaskModel
from app.schemas.task import TaskCreate, TaskUpdate, SubTaskCreate, SubTaskUpdate
from app.services.recurrence_utils import parse_date, parse_recurrence_data


class TaskService:
    """Business logic for task and subtask operations."""

    @staticmethod
    def get_all_tasks(db: Session) -> List[TaskModel]:
        """Return all tasks ordered by creation date descending."""
        return db.query(TaskModel).order_by(TaskModel.created_at.desc()).all()

    @staticmethod
    def get_task(db: Session, task_id: str) -> Optional[TaskModel]:
        """Return a single task by ID, or None if not found."""
        return db.query(TaskModel).filter(TaskModel.id == task_id).first()

    @staticmethod
    def create_task(db: Session, task_data: TaskCreate) -> TaskModel:
        """Create or update a task (upsert by ID)."""
        recurrence_data = parse_recurrence_data(task_data.recurrence)

        if task_data.id:
            # 检查是否已存在同 ID 的任务（前端乐观更新可能已同步过一次）
            existing = db.query(TaskModel).filter(TaskModel.id == task_data.id).first()
            if existing:
                # 已存在 → 更新而不是插入
                for key, value in {
                    "title": task_data.title,
                    "description": task_data.description or "",
                    "due_date": parse_date(task_data.due_date),
                    "priority": task_data.priority,
                    "completed": task_data.completed,
                    "category": task_data.category or "",
                    "start_date": parse_date(task_data.start_date),
                    "task_type": task_data.task_type or "single",
                    "recurrence_type": recurrence_data["recurrence_type"],
                    "recurrence_interval": recurrence_data["recurrence_interval"],
                    "recurrence_end_date": recurrence_data["recurrence_end_date"],
                    "reminder_enabled": task_data.reminder_enabled,
                    "notification_id": task_data.notification_id or 0,
                }.items():
                    setattr(existing, key, value)
                existing.set_recurrence_days(recurrence_data["recurrence_days"])
                existing.set_recurrence_exceptions(recurrence_data["recurrence_exceptions"])
                existing.set_completed_dates(task_data.completed_dates)
                existing = TaskService.update_updated_at(existing)
                db.flush()
                return existing

        task = TaskModel(
            id=task_data.id or str(uuid.uuid4()),
            title=task_data.title,
            description=task_data.description or "",
            due_date=parse_date(task_data.due_date),
            priority=task_data.priority,
            completed=task_data.completed,
            category=task_data.category or "",
            start_date=parse_date(task_data.start_date),
            task_type=task_data.task_type or "single",
            recurrence_type=recurrence_data["recurrence_type"],
            recurrence_interval=recurrence_data["recurrence_interval"],
            recurrence_end_date=recurrence_data["recurrence_end_date"],
            reminder_enabled=task_data.reminder_enabled,
            notification_id=task_data.notification_id or 0,
            version=1,
        )
        task.set_recurrence_days(recurrence_data["recurrence_days"])
        task.set_recurrence_exceptions(recurrence_data["recurrence_exceptions"])
        task.set_completed_dates(task_data.completed_dates)

        db.add(task)
        db.flush()

        if task_data.subtasks:
            TaskService._create_subtasks_recursive(db, task.id, None, task_data.subtasks)

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def _create_subtasks_recursive(
        db: Session,
        task_id: str,
        parent_id: Optional[str],
        subtasks_data: List[SubTaskCreate],
    ) -> None:
        for idx, sub_data in enumerate(subtasks_data):
            subtask = SubTaskModel(
                id=sub_data.id or str(uuid.uuid4()),
                task_id=task_id,
                parent_id=parent_id,
                title=sub_data.title,
                completed=sub_data.completed,
                level=sub_data.level,
                sort_order=sub_data.sort_order if sub_data.sort_order != 0 else idx,
            )
            db.add(subtask)
            db.flush()

            if sub_data.subtasks:
                TaskService._create_subtasks_recursive(
                    db, task_id, subtask.id, sub_data.subtasks
                )

    @staticmethod
    def update_task(db: Session, task_id: str, task_data: TaskUpdate) -> Optional[TaskModel]:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if not task:
            return None

        if task_data.version is not None and task_data.version != task.version:
            raise ValueError(
                f"Version conflict: expected {task.version}, got {task_data.version}"
            )

        if task_data.recurrence is not None:
            recurrence_data = parse_recurrence_data(task_data.recurrence)
            if task_data.recurrence.enabled:
                task.recurrence_type = recurrence_data["recurrence_type"]
                task.recurrence_interval = recurrence_data["recurrence_interval"]
                task.set_recurrence_days(recurrence_data["recurrence_days"])
                task.set_recurrence_exceptions(recurrence_data["recurrence_exceptions"])
                task.recurrence_end_date = recurrence_data["recurrence_end_date"]
            else:
                task.recurrence_type = None
                task.recurrence_interval = None
                task.recurrence_end_date = None
                task.set_recurrence_days([])
                task.set_recurrence_exceptions([])

        if task_data.title is not None:
            task.title = task_data.title
        if task_data.description is not None:
            task.description = task_data.description
        if task_data.due_date is not None:
            task.due_date = parse_date(task_data.due_date)
        if task_data.priority is not None:
            task.priority = task_data.priority
        if task_data.completed is not None:
            task.completed = task_data.completed
        if task_data.category is not None:
            task.category = task_data.category
        if task_data.start_date is not None:
            task.start_date = parse_date(task_data.start_date)
        if task_data.task_type is not None:
            task.task_type = task_data.task_type
        if task_data.reminder_enabled is not None:
            task.reminder_enabled = task_data.reminder_enabled
        if task_data.notification_id is not None:
            task.notification_id = task_data.notification_id
        if task_data.completed_dates is not None:
            task.set_completed_dates(task_data.completed_dates)

        task.updated_at = datetime.now(timezone.utc)
        task.increment_version()

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete_task(db: Session, task_id: str) -> bool:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if not task:
            return False
        db.delete(task)
        db.commit()
        return True

    @staticmethod
    def toggle_completed(db: Session, task_id: str) -> Optional[TaskModel]:
        """Toggle the completed status of a task.
        
        Fix #1: 同时更新 completed_dates，确保前端通过 generateTaskInstances
        重新计算 completed 状态时能匹配到 completed_dates。
        """
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if not task:
            return None

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        if not task.completed:
            # 标记为完成 → 添加今天到 completed_dates
            task.completed = True
            dates = task.get_completed_dates()
            if today_str not in dates:
                # 创建新列表以触发 SQLAlchemy change tracking
                new_dates = list(dates)
                new_dates.append(today_str)
                task.set_completed_dates(new_dates)
            else:
                task.set_completed_dates(list(dates))
        else:
            # 标记为未完成 → 从 completed_dates 中移除今天
            task.completed = False
            dates = task.get_completed_dates()
            if today_str in dates:
                # 创建新列表以触发 SQLAlchemy change tracking
                new_dates = list(dates)
                new_dates.remove(today_str)
                task.set_completed_dates(new_dates)
            else:
                task.set_completed_dates(list(dates))

        task.updated_at = datetime.now(timezone.utc)
        task.increment_version()

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def add_subtask(db: Session, task_id: str, subtask_data: SubTaskCreate) -> Optional[SubTaskModel]:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if not task:
            return None

        max_order = db.query(SubTaskModel).filter(
            SubTaskModel.task_id == task_id
        ).count()

        subtask = SubTaskModel(
            id=subtask_data.id or str(uuid.uuid4()),
            task_id=task_id,
            parent_id=subtask_data.parent_id,
            title=subtask_data.title,
            completed=subtask_data.completed,
            level=subtask_data.level,
            sort_order=subtask_data.sort_order if subtask_data.sort_order != 0 else max_order,
        )
        db.add(subtask)
        db.commit()
        db.refresh(subtask)
        return subtask

    @staticmethod
    def update_subtask(
        db: Session, task_id: str, subtask_id: str, subtask_data: SubTaskUpdate
    ) -> Optional[SubTaskModel]:
        subtask = db.query(SubTaskModel).filter(
            SubTaskModel.id == subtask_id,
            SubTaskModel.task_id == task_id,
        ).first()
        if not subtask:
            return None

        update_fields = subtask_data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(subtask, field, value)

        db.commit()
        db.refresh(subtask)
        return subtask

    @staticmethod
    def delete_subtask(db: Session, task_id: str, subtask_id: str) -> bool:
        subtask = db.query(SubTaskModel).filter(
            SubTaskModel.id == subtask_id,
            SubTaskModel.task_id == task_id,
        ).first()
        if not subtask:
            return False
        db.delete(subtask)
        db.commit()
        return True

    @staticmethod
    def update_updated_at(task: TaskModel) -> TaskModel:
        """Update the updated_at timestamp."""
        from datetime import datetime
        if hasattr(task, 'updated_at'):
            task.updated_at = datetime.utcnow()
        return task
