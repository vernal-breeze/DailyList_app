from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON

from app.database import Base


class SyncQueueModel(Base):
    __tablename__ = "sync_queue"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(36), nullable=False, index=True)
    operation = Column(String(20), nullable=False)
    payload = Column(JSON, nullable=True)
    client_timestamp = Column(DateTime, nullable=True)
    synced = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now(timezone.utc))
    error_message = Column(Text, nullable=True)
