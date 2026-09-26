from app.core.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    recipient_name = Column(String(100), nullable=False)
    mobile_number = Column(String(30), nullable=False)
    message = Column(String(500), nullable=False)
    notification_type = Column(String(50), nullable=False)  # WARNING_5MIN, OVERDUE, SECURITY_ALERT, PASS_ISSUED
    status = Column(String(20), default="SENT")  # SENT, SIMULATED, FAILED
    sent_at = Column(DateTime, default=datetime.utcnow, index=True)

    visit = relationship("Visit", back_populates="notifications")
