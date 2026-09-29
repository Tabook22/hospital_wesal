from app.core.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    visit_number = Column(String(50), unique=True, index=True, nullable=False)  # VIS-2026-000124
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    service_type = Column(String(30), default="PATIENT_VISIT")  # PATIENT_VISIT, COMPANION_ACCESS

    # PENDING_APPROVAL, REGISTERED, ACTIVE, ENDING_SOON, OVERDUE, CHECKED_OUT, CANCELLED, REJECTED
    status = Column(String(30), default="REGISTERED", index=True, nullable=False)
    visitor_relationship = Column(String(50), nullable=True)  # FIRST_DEGREE, SECOND_DEGREE, EXTENDED_FAMILY, FRIEND, COMPANION
    rejection_reason = Column(String(255), nullable=True)

    registered_at = Column(DateTime, default=datetime.utcnow)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    max_duration_minutes = Column(Integer, default=20)

    # Recorded during access
    check_in_at = Column(DateTime, nullable=True)
    expected_exit_at = Column(DateTime, nullable=True)
    checked_out_at = Column(DateTime, nullable=True)

    # Location tracking
    last_checkpoint_id = Column(Integer, ForeignKey("checkpoints.id"), nullable=True)
    last_checkpoint_name = Column(String(100), nullable=True)
    last_activity_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="visits")
    visitor = relationship("Visitor", back_populates="visits")
    ward = relationship("Ward")
    last_checkpoint = relationship("Checkpoint")
    pass_obj = relationship("VisitorPass", back_populates="visit", uselist=False, cascade="all, delete-orphan")
    scans = relationship("ScanEvent", back_populates="visit", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="visit", cascade="all, delete-orphan")

class VisitorPass(Base):
    __tablename__ = "visitor_passes"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, unique=True)
    pass_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., WES-000124
    secure_token = Column(String(100), unique=True, index=True, nullable=False)  # random crypto token
    qr_payload = Column(String(255), nullable=False)  # Token string or URL
    qr_image_base64 = Column(String, nullable=True)  # base64 encoded png for direct rendering

    # ACTIVE, USED, EXPIRED, REVOKED
    status = Column(String(20), default="ACTIVE", index=True, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)

    visit = relationship("Visit", back_populates="pass_obj")
    scans = relationship("ScanEvent", back_populates="pass_obj")
