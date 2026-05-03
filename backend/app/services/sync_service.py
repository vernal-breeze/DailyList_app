from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session

from app.models.sync_queue import SyncQueueModel


class SyncService:
    """Business logic for data synchronization."""

    @staticmethod
    def process_operations(db: Session, operations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process a batch of sync operations from a client.

        Each operation should have:
          - entity_type: str (e.g. "task", "subtask", "settings")
          - entity_id: int
          - operation: str ("create", "update", "delete")
          - payload: dict (optional)
          - client_timestamp: str (ISO format, optional)
        """
        results = []
        errors = []

        for op in operations:
            try:
                queue_entry = SyncQueueModel(
                    entity_type=op.get("entity_type", "unknown"),
                    entity_id=op.get("entity_id", 0),
                    operation=op.get("operation", "unknown"),
                    payload=op.get("payload"),
                    client_timestamp=(
                        datetime.fromisoformat(op["client_timestamp"])
                        if op.get("client_timestamp")
                        else None
                    ),
                    synced=False,
                )
                db.add(queue_entry)
                results.append({
                    "entity_type": queue_entry.entity_type,
                    "entity_id": queue_entry.entity_id,
                    "operation": queue_entry.operation,
                    "status": "queued",
                })
            except Exception as e:
                errors.append({
                    "entity_type": op.get("entity_type"),
                    "entity_id": op.get("entity_id"),
                    "error": str(e),
                })

        db.commit()

        return {
            "processed": len(results),
            "errors": len(errors),
            "results": results,
            "error_details": errors,
        }

    @staticmethod
    def get_changes_since(db: Session, since: datetime) -> List[Dict[str, Any]]:
        """
        Return all sync queue entries created after the given timestamp.

        Args:
            since: ISO format datetime string or datetime object.
        """
        query = db.query(SyncQueueModel).filter(
            SyncQueueModel.created_at > since
        ).order_by(SyncQueueModel.created_at.asc())

        entries = query.all()
        return [
            {
                "id": entry.id,
                "entity_type": entry.entity_type,
                "entity_id": entry.entity_id,
                "operation": entry.operation,
                "payload": entry.payload,
                "client_timestamp": (
                    entry.client_timestamp.isoformat()
                    if entry.client_timestamp
                    else None
                ),
                "synced": entry.synced,
                "created_at": entry.created_at.isoformat(),
                "error_message": entry.error_message,
            }
            for entry in entries
        ]
