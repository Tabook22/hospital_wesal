from app.core.database import Base
from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(50), nullable=True)
    action = Column(String(50), nullable=False, index=True)  # LOGIN, VISITOR_CREATED, PASS_CREATED, etc.
    entity_type = Column(String(50), nullable=True)  # VISIT, VISITOR, PASS, CHECKPOINT, POLICY
    entity_id = Column(String(50), nullable=True)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
