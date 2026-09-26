from app.core.database import Base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    floor = Column(String(50), nullable=False)
    max_visitors_capacity = Column(Integer, default=20)

    rooms = relationship("Room", back_populates="ward", cascade="all, delete-orphan")
    patients = relationship("Patient", back_populates="ward")
    checkpoints = relationship("Checkpoint", back_populates="ward")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    room_number = Column(String(50), nullable=False)
    max_beds = Column(Integer, default=2)

    ward = relationship("Ward", back_populates="rooms")
    patients = relationship("Patient", back_populates="room")

class Checkpoint(Base):
    __tablename__ = "checkpoints"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # CP-01, CP-02, etc.
    name = Column(String(100), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)  # Nullable for entrance/exit
    checkpoint_type = Column(String(50), nullable=False)  # ENTRY_GATE, WARD_CHECKPOINT, EXIT_GATE
    is_active = Column(Boolean, default=True)

    ward = relationship("Ward", back_populates="checkpoints")
    scans = relationship("ScanEvent", back_populates="checkpoint")
