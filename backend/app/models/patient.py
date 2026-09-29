from app.core.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    hospital_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g., P00021
    full_name = Column(String(100), index=True, nullable=False)
    civil_id = Column(String(50), nullable=True)
    gender = Column(String(10), nullable=False)  # Male, Female
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    bed = Column(String(20), nullable=False)  # Bed A, Bed 1, etc.
    admission_status = Column(String(20), default="ADMITTED")  # ADMITTED, DISCHARGED
    admission_date = Column(DateTime, default=datetime.utcnow)
    max_concurrent_visitors = Column(Integer, default=2)
    max_daily_visitors = Column(Integer, default=6)
    visitation_category = Column(String(20), default="ALLOWED")  # ALLOWED, LIMITED, PROHIBITED

    ward = relationship("Ward", back_populates="patients")
    room = relationship("Room", back_populates="patients")
    visits = relationship("Visit", back_populates="patient")
