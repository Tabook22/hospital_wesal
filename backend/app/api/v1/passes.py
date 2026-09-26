from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.visit import VisitorPass, Visit
from app.schemas.visit import VisitorPassResponse
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("", response_model=List[VisitorPassResponse])
def get_passes(db: Session = Depends(get_db)):
    passes = db.query(VisitorPass).order_by(VisitorPass.generated_at.desc()).all()
    return passes

@router.get("/{token_or_code}")
def get_pass_by_token(token_or_code: str, db: Session = Depends(get_db)):
    clean_val = token_or_code.strip()
    p = db.query(VisitorPass).filter(
        (VisitorPass.secure_token == clean_val) | 
        (VisitorPass.pass_code == clean_val)
    ).first()
    
    if not p:
        raise HTTPException(status_code=404, detail="Visitor pass not found")

    v = p.visit
    return {
        "pass_id": p.id,
        "pass_code": p.pass_code,
        "secure_token": p.secure_token,
        "qr_payload": p.qr_payload,
        "qr_image_base64": p.qr_image_base64,
        "status": p.status,
        "generated_at": p.generated_at,
        "revoked_at": p.revoked_at,
        "visitor_name": v.visitor.full_name,
        "visitor_type": v.visitor.visitor_type,
        "visitor_mobile": v.visitor.mobile_number,
        "patient_name": v.patient.full_name,
        "patient_hospital_number": v.patient.hospital_number,
        "ward_name": v.ward.name,
        "room_number": v.patient.room.room_number if v.patient.room else "N/A",
        "valid_from": v.valid_from,
        "valid_until": v.valid_until,
        "max_duration_minutes": v.max_duration_minutes,
        "visit_status": v.status
    }

@router.post("/{id}/revoke")
def revoke_pass(id: int, db: Session = Depends(get_db)):
    p = db.query(VisitorPass).filter(VisitorPass.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")

    p.status = "REVOKED"
    p.revoked_at = datetime.utcnow()
    if p.visit:
        p.visit.status = "CANCELLED"

    db.commit()

    log_audit(
        db=db,
        action="PASS_REVOKED",
        entity_type="PASS",
        entity_id=str(p.id),
        details={"pass_code": p.pass_code}
    )

    return {"message": f"Pass {p.pass_code} successfully revoked"}
