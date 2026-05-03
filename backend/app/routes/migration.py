from typing import Dict, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import ApiResponse
from app.services.migration_service import MigrationService

router = APIRouter(prefix="/api/migration", tags=["migration"])


class MigrationImportRequest(BaseModel):
    """Request body for importing data from localStorage."""
    tasks: list = []
    settings: Dict[str, Any] = None


@router.post("/import", response_model=ApiResponse)
def import_data(request: MigrationImportRequest, db: Session = Depends(get_db)):
    """
    Import tasks and settings from a localStorage export.

    Accepts a JSON body with an optional "tasks" array and optional "settings" object.
    Tasks may contain nested subtasks with a "subtasks" array.
    """
    data = request.model_dump()
    result = MigrationService.import_from_localstorage(db, data)

    if result["total_errors"] > 0:
        return ApiResponse(
            success=True,
            data=result,
            message=f"Imported {result['imported_tasks']} tasks with {result['total_errors']} errors",
            code=207,
        )

    return ApiResponse.ok(
        data=result,
        message=f"Successfully imported {result['imported_tasks']} tasks and {result['imported_subtasks']} subtasks",
    )


@router.get("/status", response_model=ApiResponse)
def migration_status(db: Session = Depends(get_db)):
    """Get the current migration/database status."""
    status = MigrationService.get_status(db)
    return ApiResponse.ok(
        data=status,
        message="Database status retrieved",
    )
