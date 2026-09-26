from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.hospital import Checkpoint
from app.models.scan import ScanEvent
from app.schemas.hospital import CheckpointResponse

router = APIRouter()

@router.get("", response_model=List[CheckpointResponse])
def get_checkpoints(db: Session = Depends(get_db)):
    cps = db.query(Checkpoint).order_by(Checkpoint.code.asc()).all()
    return cps

@router.get("/{id}/scans")
def get_checkpoint_scans(id: int, db: Session = Depends(get_db)):
    cp = db.query(Checkpoint).filter(Checkpoint.id == id).first()
    if not cp:
        raise HTTPException(status_code=404, detail="Checkpoint not found")

    scans = db.query(ScanEvent).filter(ScanEvent.checkpoint_id == cp.id).order_by(ScanEvent.scan_time.desc()).limit(50).all()
    
    return [
        {
            "id": s.id,
            "scan_time": s.scan_time,
            "result": s.result,
            "denial_reason": s.denial_reason,
            "visitor_name": s.visit.visitor.full_name if s.visit else "Unknown",
            "pass_code": s.pass_obj.pass_code if s.pass_obj else "N/A",
            "patient_name": s.visit.patient.full_name if s.visit else "N/A"
        }
        for s in scans
    ]
