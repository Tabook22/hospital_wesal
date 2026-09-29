from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timedelta, date

from app.core.database import get_db
from app.core.security import get_password_hash, create_access_token, decode_access_token, oauth2_scheme
from app.models.user import User
from app.models.visitor import Visitor
from app.models.patient import Patient
from app.models.visit import Visit, VisitorPass
from app.models.policy import VisitPolicy
from app.schemas.auth import Token
from app.schemas.visitor_portal import (
    VisitorRegisterRequest,
    VisitorPatientSearchItem,
    VisitorPassBookRequest,
    VisitorPassDetail
)
from app.services.qr_service import generate_secure_token, generate_pass_code, generate_visit_number, generate_qr_base64
from app.services.audit_service import log_audit
from app.api.v1.ws import ws_manager

router = APIRouter()

def get_current_visitor_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    
    payload = decode_access_token(token)
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user

@router.post("/auth/register", response_model=Token)
def register_visitor(reg: VisitorRegisterRequest, db: Session = Depends(get_db)):
    clean_username = reg.username.lower().strip()
    
    # 1. Check if username already exists
    existing_user = db.query(User).filter(User.username == clean_username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered. Please choose another username or log in."
        )

    # 2. Create User record with VISITOR role
    hashed_pw = get_password_hash(reg.password)
    new_user = User(
        username=clean_username,
        hashed_password=hashed_pw,
        full_name=reg.full_name.strip(),
        role="VISITOR",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. Create or link Visitor profile
    visitor = db.query(Visitor).filter(Visitor.civil_id == reg.civil_id.strip()).first()
    if not visitor:
        visitor = Visitor(
            full_name=reg.full_name.strip(),
            civil_id=reg.civil_id.strip(),
            mobile_number=reg.mobile_number.strip(),
            visitor_type="VISITOR",
            created_at=datetime.utcnow()
        )
        db.add(visitor)
        db.commit()
        db.refresh(visitor)

    # 4. Generate Access Token
    access_token = create_access_token(subject=new_user.username, role=new_user.role)

    log_audit(
        db=db,
        action="VISITOR_REGISTER",
        user_id=new_user.id,
        username=new_user.username,
        entity_type="USER",
        entity_id=str(new_user.id),
        details={"full_name": new_user.full_name, "civil_id": reg.civil_id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "username": new_user.username,
        "full_name": new_user.full_name,
        "role": new_user.role
    }

@router.get("/patients/search", response_model=List[VisitorPatientSearchItem])
def search_patients_for_visitor(
    q: Optional[str] = Query(None, description="Patient name, MRN, or civil ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Patient).filter(Patient.admission_status == "ADMITTED")

    if q and q.strip():
        clean_q = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(clean_q),
                Patient.hospital_number.ilike(clean_q),
                Patient.civil_id.ilike(clean_q)
            )
        )

    patients = query.limit(25).all()
    policy = db.query(VisitPolicy).first()
    visiting_hours = f"{policy.visiting_start} - {policy.visiting_end}" if policy else "16:00 - 20:00"

    results = []
    for p in patients:
        concurrent_count = db.query(Visit).filter(
            Visit.patient_id == p.id,
            Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
        ).count()
        can_admit = concurrent_count < p.max_concurrent_visitors

        results.append(
            VisitorPatientSearchItem(
                id=p.id,
                hospital_number=p.hospital_number,
                full_name=p.full_name,
                ward_name=p.ward.name if p.ward else "General Ward",
                room_number=p.room.room_number if p.room else "N/A",
                bed=p.bed or "B1",
                admission_status=p.admission_status,
                can_admit_visitor=can_admit,
                current_concurrent_visitors=concurrent_count,
                max_concurrent_visitors=p.max_concurrent_visitors,
                visiting_hours=visiting_hours
            )
        )

    return results

@router.post("/passes/book", response_model=VisitorPassDetail)
async def book_visitor_pass(
    book_req: VisitorPassBookRequest,
    current_user: User = Depends(get_current_visitor_user),
    db: Session = Depends(get_db)
):
    # 1. Validate Patient
    patient = db.query(Patient).filter(Patient.id == book_req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Selected patient was not found")
    if patient.admission_status != "ADMITTED":
        raise HTTPException(status_code=400, detail="Patient has been discharged and cannot receive visitors")

    # 2. Resolve Visitor record for current user
    # Find matching visitor by full_name or user info
    visitor = db.query(Visitor).filter(Visitor.full_name == current_user.full_name).first()
    if not visitor:
        visitor = Visitor(
            full_name=current_user.full_name,
            civil_id=f"OM-{current_user.id:06d}",
            mobile_number="+968 90000000",
            visitor_type=book_req.visitor_type,
            notes=book_req.notes,
            created_at=datetime.utcnow()
        )
        db.add(visitor)
        db.commit()
        db.refresh(visitor)

    # 3. Check for existing active pass for this patient
    existing_active = db.query(Visit).filter(
        Visit.visitor_id == visitor.id,
        Visit.patient_id == patient.id,
        Visit.status.in_(["REGISTERED", "ACTIVE", "ENDING_SOON", "OVERDUE"])
    ).first()
    if existing_active and existing_active.pass_obj:
        p = existing_active.pass_obj
        return VisitorPassDetail(
            visit_id=existing_active.id,
            visit_number=existing_active.visit_number,
            pass_code=p.pass_code,
            secure_token=p.secure_token,
            qr_payload=p.qr_payload,
            qr_image_base64=p.qr_image_base64,
            visitor_name=visitor.full_name,
            visitor_civil_id=visitor.civil_id,
            visitor_mobile=visitor.mobile_number,
            visitor_type=visitor.visitor_type,
            patient_name=patient.full_name,
            patient_hospital_number=patient.hospital_number,
            ward_name=patient.ward.name if patient.ward else "General Ward",
            room_number=patient.room.room_number if patient.room else "N/A",
            bed=patient.bed or "B1",
            valid_from=existing_active.valid_from,
            valid_until=existing_active.valid_until,
            max_duration_minutes=existing_active.max_duration_minutes,
            status=p.status,
            generated_at=p.generated_at
        )

    # 4. Check Bedside Concurrent Limit
    concurrent_count = db.query(Visit).filter(
        Visit.patient_id == patient.id,
        Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
    ).count()

    if concurrent_count >= patient.max_concurrent_visitors:
        raise HTTPException(
            status_code=400,
            detail=f"Patient room is currently at maximum capacity ({concurrent_count}/{patient.max_concurrent_visitors} visitors). Please try again shortly."
        )

    # 5. Create Visit and Pass
    now = datetime.utcnow()
    valid_from = now
    duration = book_req.duration_minutes if book_req.duration_minutes > 0 else 20
    valid_until = now + timedelta(hours=4)

    visit_number = generate_visit_number()
    new_visit = Visit(
        visit_number=visit_number,
        patient_id=patient.id,
        visitor_id=visitor.id,
        ward_id=patient.ward_id,
        service_type="VISITOR_PORTAL",
        status="REGISTERED",
        registered_at=now,
        valid_from=valid_from,
        valid_until=valid_until,
        max_duration_minutes=duration
    )
    db.add(new_visit)
    db.commit()
    db.refresh(new_visit)

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

    log_audit(
        db=db,
        action="VISITOR_PASS_SELF_BOOKED",
        user_id=current_user.id,
        username=current_user.username,
        entity_type="VISIT",
        entity_id=str(new_visit.id),
        details={"visit_number": visit_number, "pass_code": pass_code, "patient": patient.full_name}
    )

    await ws_manager.broadcast({
        "type": "VISIT_CREATED",
        "visit_id": new_visit.id,
        "visit_number": visit_number,
        "visitor_name": visitor.full_name,
        "patient_name": patient.full_name,
        "ward_name": patient.ward.name if patient.ward else "Ward"
    })

    return VisitorPassDetail(
        visit_id=new_visit.id,
        visit_number=new_visit.visit_number,
        pass_code=new_pass.pass_code,
        secure_token=new_pass.secure_token,
        qr_payload=new_pass.qr_payload,
        qr_image_base64=new_pass.qr_image_base64,
        visitor_name=visitor.full_name,
        visitor_civil_id=visitor.civil_id,
        visitor_mobile=visitor.mobile_number,
        visitor_type=visitor.visitor_type,
        patient_name=patient.full_name,
        patient_hospital_number=patient.hospital_number,
        ward_name=patient.ward.name if patient.ward else "General Ward",
        room_number=patient.room.room_number if patient.room else "N/A",
        bed=patient.bed or "B1",
        valid_from=new_visit.valid_from,
        valid_until=new_visit.valid_until,
        max_duration_minutes=new_visit.max_duration_minutes,
        status=new_pass.status,
        generated_at=new_pass.generated_at
    )

@router.get("/my-passes", response_model=List[VisitorPassDetail])
def get_my_visitor_passes(
    current_user: User = Depends(get_current_visitor_user),
    db: Session = Depends(get_db)
):
    visitor = db.query(Visitor).filter(Visitor.full_name == current_user.full_name).first()
    if not visitor:
        return []

    visits = db.query(Visit).filter(Visit.visitor_id == visitor.id).order_by(Visit.registered_at.desc()).all()
    results = []
    for v in visits:
        if v.pass_obj:
            results.append(
                VisitorPassDetail(
                    visit_id=v.id,
                    visit_number=v.visit_number,
                    pass_code=v.pass_obj.pass_code,
                    secure_token=v.pass_obj.secure_token,
                    qr_payload=v.pass_obj.qr_payload,
                    qr_image_base64=v.pass_obj.qr_image_base64,
                    visitor_name=visitor.full_name,
                    visitor_civil_id=visitor.civil_id,
                    visitor_mobile=visitor.mobile_number,
                    visitor_type=visitor.visitor_type,
                    patient_name=v.patient.full_name if v.patient else "Patient",
                    patient_hospital_number=v.patient.hospital_number if v.patient else "N/A",
                    ward_name=v.ward.name if v.ward else "Ward",
                    room_number=v.patient.room.room_number if (v.patient and v.patient.room) else "N/A",
                    bed=v.patient.bed if v.patient else "B1",
                    valid_from=v.valid_from,
                    valid_until=v.valid_until,
                    max_duration_minutes=v.max_duration_minutes,
                    status=v.pass_obj.status,
                    generated_at=v.pass_obj.generated_at
                )
            )

    return results
