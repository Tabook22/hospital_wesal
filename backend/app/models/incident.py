from app.core.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

class StaffIncident(Base):
    __tablename__ = "staff_incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Reporter details
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_name = Column(String(100), nullable=False)
    reporter_role = Column(String(50), default="NURSE", nullable=False)  # NURSE, DOCTOR, SECURITY, WARD_SUPERVISOR, ADMIN
    
    # Incident classification
    # UNAUTHORIZED_AREA, NOISE_DISTURBANCE, OVERCROWDING, URGENT_ACTION, VISITING_HOURS_VIOLATION, BEHAVIORAL_ISSUE, OTHER
    category = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="HIGH", index=True, nullable=False)  # URGENT, HIGH, MEDIUM, LOW

    # Location
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    ward_name = Column(String(100), nullable=False)
    location_details = Column(String(150), nullable=True)  # Room 204, Bed B, Corridor, etc.

    # Optional visitor / pass / patient linkage
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=True)
    visitor_name = Column(String(100), nullable=True)
    pass_code = Column(String(50), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    patient_name = Column(String(100), nullable=True)

    # Narrative & Employee comments
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False)
    suggested_action = Column(String(255), nullable=True)

    # Status & Administrative Resolution
    # OPEN, DISPATCHED, RESOLVED, DISMISSED
    status = Column(String(30), default="OPEN", index=True, nullable=False)
    admin_notes = Column(String(500), nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id])
    ward = relationship("Ward", foreign_keys=[ward_id])
    visitor = relationship("Visitor", foreign_keys=[visitor_id])
    patient = relationship("Patient", foreign_keys=[patient_id])
