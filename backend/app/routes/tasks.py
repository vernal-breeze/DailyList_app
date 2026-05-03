from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse,
    SubTaskCreate, SubTaskUpdate, SubTaskResponse,
    RecurrenceSchema, RecurrenceEnd,
)
from app.services.task_service import TaskService
from app.models.task import TaskModel
from app.models.subtask import SubTaskModel
from app.limiter import limiter

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


# ---------------------------------------------------------------------------
# Helper: convert flat DB model to nested response schema
# ---------------------------------------------------------------------------

def _build_subtask_tree(subtasks: List[SubTaskModel]) -> List[dict]:
    """
    Build a nested subtask tree from a flat list of SubTaskModel objects.
    Returns list of dicts matching frontend SubTask format.
    """
    sub_map: Dict[str, dict] = {}

    for sub in subtasks:
        node = {
            "id": sub.id,
            "title": sub.title,
            "completed": sub.completed,
            "parentId": sub.parent_id,
            "level": sub.level,
            "sortOrder": sub.sort_order,
            "subtasks": [],
        }
        sub_map[sub.id] = node

    roots: List[dict] = []
    for sub in subtasks:
        node = sub_map[sub.id]
        if sub.parent_id is not None and sub.parent_id in sub_map:
            parent = sub_map[sub.parent_id]
            parent["subtasks"].append(node)
        else:
            roots.append(node)

    # Sort each level by sort_order
    def sort_children(items: List[dict]) -> List[dict]:
        items.sort(key=lambda x: x.get("sortOrder", 0))
        for item in items:
            if item["subtasks"]:
                sort_children(item["subtasks"])
        return items

    return sort_children(roots)


def _build_recurrence(task: TaskModel) -> dict:
    """Build nested recurrence object from flat DB fields."""
    recurrence_days = task.get_recurrence_days()
    recurrence_exceptions = task.get_recurrence_exceptions()

    enabled = bool(task.recurrence_type)

    end: dict = {"type": "never"}
    if task.recurrence_end_date:
        end = {"type": "on", "date": task.recurrence_end_date.isoformat() if hasattr(task.recurrence_end_date, 'isoformat') else str(task.recurrence_end_date)}

    return {
        "enabled": enabled,
        "type": task.recurrence_type or "daily",
        "interval": task.recurrence_interval or 1,
        "days": recurrence_days if recurrence_days else [],
        "end": end,
        "exceptions": recurrence_exceptions if recurrence_exceptions else [],
    }


def model_to_response(task: TaskModel) -> dict:
    """Convert a TaskModel (with loaded subtasks) to a dict matching frontend Task format."""
    flat_subtasks = task.subtasks if task.subtasks else []
    nested_subtasks = _build_subtask_tree(flat_subtasks)
    recurrence = _build_recurrence(task)

    due_date = None
    if task.due_date:
        due_date = task.due_date.isoformat() if hasattr(task.due_date, 'isoformat') else str(task.due_date)

    start_date = None
    if task.start_date:
        start_date = task.start_date.isoformat() if hasattr(task.start_date, 'isoformat') else str(task.start_date)

    created_at = task.created_at.isoformat() if hasattr(task.created_at, 'isoformat') else str(task.created_at)
    updated_at = task.updated_at.isoformat() if hasattr(task.updated_at, 'isoformat') else str(task.updated_at)

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description or "",
        "dueDate": due_date,
        "priority": task.priority,
        "completed": task.completed,
        "createdAt": created_at,
        "category": task.category or "",
        "subtasks": nested_subtasks,
        "startDate": start_date,
        "taskType": task.task_type or "single",
        "recurrence": recurrence,
        "reminderEnabled": task.reminder_enabled,
        "notificationId": task.notification_id or 0,
        "completedDates": task.get_completed_dates(),
        "updatedAt": updated_at,
        "version": task.version,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=ApiResponse)
@limiter.limit("100/minute")
def get_all_tasks(
    request: Request,
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    priority: Optional[str] = Query(None, description="Filter by priority (low/medium/high)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    sort_by: Optional[str] = Query("created_at", description="Sort field (created_at/due_date/priority/title)"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    page: Optional[int] = Query(1, ge=1, description="Page number"),
    page_size: Optional[int] = Query(50, ge=1, le=200, description="Items per page"),
    db: Session = Depends(get_db),
):
    """Get tasks with filtering, sorting and pagination."""
    tasks = TaskService.get_all_tasks(db)

    # Apply filters
    if completed is not None:
        tasks = [t for t in tasks if t.completed == completed]
    if priority is not None:
        tasks = [t for t in tasks if t.priority == priority]
    if category is not None:
        tasks = [t for t in tasks if t.category == category]

    # Apply sorting
    reverse = sort_order == "desc"
    if sort_by == "due_date":
        tasks.sort(key=lambda t: t.due_date or "", reverse=reverse)
    elif sort_by == "priority":
        priority_order = {"high": 0, "medium": 1, "low": 2}
        tasks.sort(key=lambda t: priority_order.get(t.priority, 99), reverse=reverse)
    elif sort_by == "title":
        tasks.sort(key=lambda t: t.title, reverse=reverse)
    else:  # created_at
        tasks.sort(key=lambda t: t.created_at, reverse=reverse)

    # Apply pagination
    total = len(tasks)
    start = (page - 1) * page_size
    end = start + page_size
    paginated_tasks = tasks[start:end]

    return ApiResponse.ok(
        data={
            "items": [model_to_response(t) for t in paginated_tasks],
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": (total + page_size - 1) // page_size,
        },
        message=f"Retrieved {len(paginated_tasks)} tasks (total: {total})",
    )


@router.get("/{task_id}", response_model=ApiResponse)
@limiter.limit("100/minute")
def get_task(request: Request, task_id: str, db: Session = Depends(get_db)):
    """Get a single task by ID with its subtasks."""
    task = TaskService.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return ApiResponse.ok(data=model_to_response(task))


@router.post("", response_model=ApiResponse, status_code=201)
@limiter.limit("10/minute")
def create_task(request: Request, task_data: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task with optional subtasks."""
    task = TaskService.create_task(db, task_data)
    return ApiResponse.ok(
        data=model_to_response(task),
        message="Task created successfully",
    )


@router.put("/{task_id}", response_model=ApiResponse)
@limiter.limit("10/minute")
def update_task(request: Request, task_id: str, task_data: TaskUpdate, db: Session = Depends(get_db)):
    """Update an existing task. Supports optimistic locking via version field."""
    try:
        task = TaskService.update_task(db, task_id, task_data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return ApiResponse.ok(
        data=model_to_response(task),
        message="Task updated successfully",
    )


@router.patch("/{task_id}/toggle", response_model=ApiResponse)
@limiter.limit("10/minute")
def toggle_task(request: Request, task_id: str, db: Session = Depends(get_db)):
    """Toggle the completed status of a task."""
    task = TaskService.toggle_completed(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return ApiResponse.ok(
        data=model_to_response(task),
        message=f"Task marked as {'completed' if task.completed else 'incomplete'}",
    )


@router.delete("/{task_id}", response_model=ApiResponse)
@limiter.limit("10/minute")
def delete_task(request: Request, task_id: str, db: Session = Depends(get_db)):
    """Delete a task and all its subtasks."""
    deleted = TaskService.delete_task(db, task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return ApiResponse.ok(message="Task deleted successfully")


# ---------------------------------------------------------------------------
# Subtask routes
# ---------------------------------------------------------------------------

@router.post("/{task_id}/subtasks", response_model=ApiResponse, status_code=201)
@limiter.limit("10/minute")
def add_subtask(request: Request, task_id: str, subtask_data: SubTaskCreate, db: Session = Depends(get_db)):
    """Add a new subtask to a task."""
    subtask = TaskService.add_subtask(db, task_id, subtask_data)
    if not subtask:
        raise HTTPException(status_code=404, detail="Task not found")
    return ApiResponse.ok(
        data={
            "id": subtask.id,
            "title": subtask.title,
            "completed": subtask.completed,
            "parentId": subtask.parent_id,
            "level": subtask.level,
            "subtasks": [],
        },
        message="Subtask created successfully",
    )


@router.put("/{task_id}/subtasks/{subtask_id}", response_model=ApiResponse)
def update_subtask(
    task_id: str,
    subtask_id: str,
    subtask_data: SubTaskUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing subtask."""
    subtask = TaskService.update_subtask(db, task_id, subtask_id, subtask_data)
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return ApiResponse.ok(
        data={
            "id": subtask.id,
            "title": subtask.title,
            "completed": subtask.completed,
            "parentId": subtask.parent_id,
            "level": subtask.level,
            "subtasks": [],
        },
        message="Subtask updated successfully",
    )


@router.delete("/{task_id}/subtasks/{subtask_id}", response_model=ApiResponse)
def delete_subtask(task_id: str, subtask_id: str, db: Session = Depends(get_db)):
    """Delete a subtask and all its children."""
    deleted = TaskService.delete_subtask(db, task_id, subtask_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return ApiResponse.ok(message="Subtask deleted successfully")
