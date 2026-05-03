from datetime import datetime
from typing import List, Dict, Any, Optional, Literal

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import ApiResponse
from app.services.sync_service import SyncService

router = APIRouter(prefix="/api/sync", tags=["sync"])


class SyncOperation(BaseModel):
    entity_type: Literal["task", "subtask", "settings"]
    entity_id: str
    operation: Literal["create", "update", "delete"]
    payload: Optional[Dict[str, Any]] = None
    client_timestamp: Optional[str] = None


class SyncPushRequest(BaseModel):
    operations: List[SyncOperation]


@router.post("/push", response_model=ApiResponse)
def push_operations(request: SyncPushRequest, db: Session = Depends(get_db)):
    """
    Push sync operations from a client to the server.

    Each operation is queued for processing and stored in the sync queue.
    """
    if not request.operations:
        return ApiResponse.ok(data={"processed": 0, "errors": 0}, message="No operations to process")

    operations_data = [op.model_dump() for op in request.operations]
    result = SyncService.process_operations(db, operations_data)

    if result["errors"] > 0:
        return ApiResponse.fail(
            message=f"Processed {result['processed']} operations with {result['errors']} errors",
            error="PARTIAL_FAILURE",
            code=207,
        )

    return ApiResponse.ok(
        data=result,
        message=f"Successfully queued {result['processed']} operations",
    )


@router.get("/pull", response_model=ApiResponse)
def pull_changes(
    since: str = Query(..., description="ISO format datetime to fetch changes since"),
    db: Session = Depends(get_db),
):
    """
    Pull sync changes from the server since a given timestamp.

    Returns all sync queue entries created after the specified time.
    """
    try:
        since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid 'since' parameter: '{since}'. Must be an ISO format datetime.",
        )

    changes = SyncService.get_changes_since(db, since_dt)
    return ApiResponse.ok(
        data=changes,
        message=f"Retrieved {len(changes)} changes since {since}",
    )
