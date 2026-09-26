from app.core.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class ScanEvent(Base):
    __tablename__ = "scan_events"

    id = Column(Integer, primary_key=True, index=True)
    pass_id = Column(Integer, ForeignKey("visitor_passes.id"), nullable=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    checkpoint_id = Column(Integer, ForeignKey("checkpoints.id"), nullable=False)
    scan_time = Column(DateTime, default=datetime.utcnow, index=True)
    result = Column(String(20), nullable=False)  # GRANTED, DENIED
    denial_reason = Column(String(255), nullable=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    pass_obj = relationship("VisitorPass", back_populates="scans")
    visit = relationship("Visit", back_populates="scans")
    checkpoint = relationship("Checkpoint", back_populates="scans")
    actor = relationship("User")
