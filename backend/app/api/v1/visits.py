from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, date, time
from app.core.database import get_db
from app.models.visit import Visit, VisitorPass
from app.models.patient import Patient
from app.models.visitor import Visitor
from app.models.hospital import Checkpoint
from app.models.policy import VisitPolicy
from app.schemas.visit import VisitCreate, VisitResponse, VisitorPassResponse, VisitCheckoutResponse
from app.services.qr_service import generate_secure_token, generate_pass_code, generate_visit_number, generate_qr_base64
from app.services.timing_engine import compute_visit_timing_state, evaluate_visit_status, evaluate_all_active_visits
from app.services.notification_service import send_pass_issued_notification
from app.services.audit_service import log_audit
from app.api.v1.ws import ws_manager

router = APIRouter()

def serialize_pass(pass_obj: Optional[VisitorPass]) -> Optional[VisitorPassResponse]:
    if not pass_obj:
        return None
    return VisitorPassResponse(
        id=pass_obj.id,
        visit_id=pass_obj.visit_id,
        pass_code=pass_obj.pass_code,
        secure_token=pass_obj.secure_token,
        qr_payload=pass_obj.qr_payload,
        qr_image_base64=pass_obj.qr_image_base64,
        status=pass_obj.status,
        generated_at=pass_obj.generated_at,
        revoked_at=pass_obj.revoked_at
    )

def enrich_visit(visit: Visit, db: Session) -> VisitResponse:
    policy = db.query(VisitPolicy).first()
    evaluate_visit_status(db, visit, policy)
    remaining_sec, is_overdue, overdue_sec = compute_visit_timing_state(visit)

    return VisitResponse(
        id=visit.id,
        visit_number=visit.visit_number,
        patient_id=visit.patient_id,
        patient_name=visit.patient.full_name,
        patient_hospital_number=visit.patient.hospital_number,
        patient_room=visit.patient.room.room_number if visit.patient.room else "N/A",
        patient_bed=visit.patient.bed,
        visitor_id=visit.visitor_id,
        visitor_name=visit.visitor.full_name,
        visitor_civil_id=visit.visitor.civil_id,
        visitor_mobile=visit.visitor.mobile_number,
        visitor_type=visit.visitor.visitor_type,
        ward_id=visit.ward_id,
        ward_name=visit.ward.name if visit.ward else "Unassigned",
        service_type=visit.service_type,
        status=visit.status,
        registered_at=visit.registered_at,
        valid_from=visit.valid_from,
        valid_until=visit.valid_until,
        max_duration_minutes=visit.max_duration_minutes,
        check_in_at=visit.check_in_at,
        expected_exit_at=visit.expected_exit_at,
        checked_out_at=visit.checked_out_at,
        last_checkpoint_name=visit.last_checkpoint_name,
        last_activity_at=visit.last_activity_at,
        pass_obj=serialize_pass(visit.pass_obj),
        remaining_seconds=remaining_sec,
        is_overdue=is_overdue,
        overdue_seconds=overdue_sec
    )

@router.post("", response_model=VisitResponse)
async def create_visit(visit_in: VisitCreate, db: Session = Depends(get_db)):
    # 1. Validate Patient
    patient = db.query(Patient).filter(Patient.id == visit_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.admission_status != "ADMITTED":
        raise HTTPException(status_code=400, detail="Patient has been discharged and cannot receive visitors")

    # 2. Resolve or Create Visitor
    if visit_in.visitor_id:
        visitor = db.query(Visitor).filter(Visitor.id == visit_in.visitor_id).first()
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
    else:
        if not visit_in.full_name or not visit_in.civil_id or not visit_in.mobile_number:
            raise HTTPException(status_code=400, detail="Visitor full name, civil ID, and mobile number are required")
        
        # Check if visitor already in DB
        visitor = db.query(Visitor).filter(Visitor.civil_id == visit_in.civil_id.strip()).first()
        if not visitor:
            visitor = Visitor(
                full_name=visit_in.full_name.strip(),
                civil_id=visit_in.civil_id.strip(),
                mobile_number=visit_in.mobile_number.strip(),
                visitor_type=visit_in.visitor_type,
                relationship_to_patient=visit_in.relationship_to_patient,
                notes=visit_in.notes,
                created_at=datetime.utcnow()
            )
            db.add(visitor)
            db.commit()
            db.refresh(visitor)

    # 3. Check if visitor is already actively visiting this patient
    active_existing = db.query(Visit).filter(
        Visit.visitor_id == visitor.id,
        Visit.patient_id == patient.id,
        Visit.status.in_(["REGISTERED", "ACTIVE", "ENDING_SOON", "OVERDUE"])
    ).first()
    if active_existing:
        raise HTTPException(
            status_code=400,
            detail=f"This visitor already has an active or pending visit ({active_existing.visit_number}) for this patient."
        )

    # 4. Check Daily Visitor Limit for Patient
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    today_count = db.query(Visit).filter(
        Visit.patient_id == patient.id,
        Visit.registered_at >= today_start
    ).count()

    if today_count >= patient.max_daily_visitors:
        raise HTTPException(
            status_code=400,
            detail=f"Daily visitor quota for this patient has been reached ({today_count}/{patient.max_daily_visitors} visits today)."
        )

    # 5. Check Concurrent Visitor Limit
    concurrent_count = db.query(Visit).filter(
        Visit.patient_id == patient.id,
        Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
    ).count()

    if concurrent_count >= patient.max_concurrent_visitors:
        raise HTTPException(
            status_code=400,
            detail=f"Bedside is at full capacity ({concurrent_count}/{patient.max_concurrent_visitors} visitors currently present)."
        )

    # 6. Policy and Validity Window
    policy = db.query(VisitPolicy).first()
    now = datetime.utcnow()

    # Determine duration
    if visit_in.duration_minutes:
        duration_minutes = visit_in.duration_minutes
    elif policy and policy.demo_mode_enabled:
        duration_minutes = policy.demo_duration_minutes
    else:
        duration_minutes = policy.default_duration_minutes if policy else 20

    # Determine visiting window
    valid_from = now
    # Default window valid until policy.visiting_end or +4 hours for prototype convenience
    valid_until = now + timedelta(hours=4)

    # 7. Create Visit
    visit_number = generate_visit_number()
    new_visit = Visit(
        visit_number=visit_number,
        patient_id=patient.id,
        visitor_id=visitor.id,
        ward_id=patient.ward_id,
        service_type=visit_in.service_type,
        status="REGISTERED",
        registered_at=now,
        valid_from=valid_from,
        valid_until=valid_until,
        max_duration_minutes=duration_minutes
    )
    db.add(new_visit)
    db.commit()
    db.refresh(new_visit)

    # 8. Generate Visitor Pass & Scannable QR Code
    pass_code = generate_pass_code()
    secure_token = generate_secure_token()
    qr_payload = secure_token
    qr_image_base64 = generate_qr_base64(qr_payload)

    new_pass = VisitorPass(
        visit_id=new_visit.id,
        pass_code=pass_code,
        secure_token=secure_token,
        qr_payload=qr_payload,
        qr_image_base64=qr_image_base64,
        status="ACTIVE",
        generated_at=now
    )
    db.add(new_pass)
    db.commit()
    db.refresh(new_pass)
    db.refresh(new_visit)

    # 9. Audit and Notification
    log_audit(
        db=db,
        action="VISIT_CREATED",
        entity_type="VISIT",
        entity_id=str(new_visit.id),
        details={"visit_number": visit_number, "pass_code": pass_code, "patient": patient.full_name, "visitor": visitor.full_name}
    )
    send_pass_issued_notification(db, new_visit)

    # 10. Broadcast via WebSocket
    await ws_manager.broadcast({
        "type": "VISIT_CREATED",
        "visit_id": new_visit.id,
        "visit_number": visit_number,
        "visitor_name": visitor.full_name,
        "patient_name": patient.full_name,
        "ward_name": patient.ward.name if patient.ward else "Ward"
    })

    return enrich_visit(new_visit, db)

@router.get("", response_model=List[VisitResponse])
def get_visits(
    status: Optional[str] = Query(None),
    ward_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    evaluate_all_active_visits(db)
    query = db.query(Visit)
    if status:
        query = query.filter(Visit.status == status)
    if ward_id:
        query = query.filter(Visit.ward_id == ward_id)

    visits = query.order_by(Visit.registered_at.desc()).all()
    results = [enrich_visit(v, db) for v in visits]

    if search:
        s = search.lower().strip()
        results = [
            r for r in results
            if s in r.visitor_name.lower() or s in r.patient_name.lower() or s in r.visit_number.lower() or (r.pass_obj and s in r.pass_obj.pass_code.lower())
        ]

    return results

@router.get("/active", response_model=List[VisitResponse])
def get_active_visits(db: Session = Depends(get_db)):
    evaluate_all_active_visits(db)
    visits = db.query(Visit).filter(
        Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
    ).order_by(Visit.expected_exit_at.asc()).all()
    return [enrich_visit(v, db) for v in visits]

@router.get("/{id}", response_model=VisitResponse)
def get_visit(id: int, db: Session = Depends(get_db)):
    visit = db.query(Visit).filter(Visit.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return enrich_visit(visit, db)

@router.post("/{id}/checkout", response_model=VisitCheckoutResponse)
async def manual_checkout(id: int, db: Session = Depends(get_db)):
    visit = db.query(Visit).filter(Visit.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    if visit.status == "CHECKED_OUT":
        raise HTTPException(status_code=400, detail="Visit is already checked out")

    now = datetime.utcnow()
    visit.status = "CHECKED_OUT"
    visit.checked_out_at = now
    if visit.pass_obj:
        visit.pass_obj.status = "USED"

    exit_cp = db.query(Checkpoint).filter(Checkpoint.checkpoint_type == "EXIT_GATE").first()
    if exit_cp:
        visit.last_checkpoint_id = exit_cp.id
        visit.last_checkpoint_name = exit_cp.name
    visit.last_activity_at = now

    db.commit()

    log_audit(
        db=db,
        action="MANUAL_CHECKOUT",
        entity_type="VISIT",
        entity_id=str(visit.id),
        details={"visitor": visit.visitor.full_name, "visit_number": visit.visit_number}
    )

    await ws_manager.broadcast({
        "type": "CHECKOUT",
        "visit_id": visit.id,
        "visitor_name": visit.visitor.full_name
    })

    return VisitCheckoutResponse(
        visit_id=visit.id,
        visit_number=visit.visit_number,
        visitor_name=visit.visitor.full_name,
        checked_out_at=now,
        status="CHECKED_OUT",
        message="Visitor checked out successfully."
    )

@router.post("/{id}/cancel")
async def cancel_visit(id: int, db: Session = Depends(get_db)):
    visit = db.query(Visit).filter(Visit.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    visit.status = "CANCELLED"
    if visit.pass_obj:
        visit.pass_obj.status = "REVOKED"
        visit.pass_obj.revoked_at = datetime.utcnow()

    db.commit()

    log_audit(
        db=db,
        action="VISIT_CANCELLED",
        entity_type="VISIT",
        entity_id=str(visit.id),
        details={"visitor": visit.visitor.full_name, "visit_number": visit.visit_number}
    )

    await ws_manager.broadcast({
        "type": "VISIT_CANCELLED",
        "visit_id": visit.id
    })

    return {"message": "Visit cancelled and pass revoked."}
