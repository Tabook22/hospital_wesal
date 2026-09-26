from app.core.database import Base
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), index=True, nullable=False)
    civil_id = Column(String(50), index=True, nullable=False)  # Civil ID / National ID
    mobile_number = Column(String(30), nullable=False)
    visitor_type = Column(String(20), default="VISITOR")  # VISITOR, COMPANION
    relationship_to_patient = Column(String(50), nullable=True)  # Brother, Spouse, Parent, Friend, etc.
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    visits = relationship("Visit", back_populates="visitor")
