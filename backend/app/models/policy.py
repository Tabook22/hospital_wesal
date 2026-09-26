from app.core.database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

class VisitPolicy(Base):
    __tablename__ = "visit_policies"

    id = Column(Integer, primary_key=True, index=True)
    visiting_start = Column(String(10), default="17:00")  # HH:MM
    visiting_end = Column(String(10), default="19:00")    # HH:MM
    default_duration_minutes = Column(Integer, default=20)
    warning_threshold_minutes = Column(Integer, default=5)
    max_concurrent_per_patient = Column(Integer, default=2)
    max_daily_per_patient = Column(Integer, default=6)
    companions_allowed = Column(Integer, default=1)
    
    # Demo settings
    demo_mode_enabled = Column(Boolean, default=True)
    demo_duration_minutes = Column(Integer, default=2)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
