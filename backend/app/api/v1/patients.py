from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
from app.models.patient import Patient
from app.models.visit import Visit
from app.schemas.patient import PatientResponse, PatientCapacityStatus

router = APIRouter()

def enrich_patient(patient: Patient, db: Session) -> PatientResponse:
    # Concurrent active visitors (inside right now)
    current_count = db.query(Visit).filter(
        Visit.patient_id == patient.id,
        Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
    ).count()

    # Total visitors today
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    today_count = db.query(Visit).filter(
        Visit.patient_id == patient.id,
        Visit.registered_at >= today_start
    ).count()

    can_admit = (
        patient.admission_status == "ADMITTED" and 
        current_count < patient.max_concurrent_visitors and
        today_count < patient.max_daily_visitors
    )

    return PatientResponse(
        id=patient.id,
        hospital_number=patient.hospital_number,
        full_name=patient.full_name,
        civil_id=patient.civil_id,
        gender=patient.gender,
        ward_id=patient.ward_id,
        ward_name=patient.ward.name if patient.ward else "Unassigned",
        room_id=patient.room_id,
        room_number=patient.room.room_number if patient.room else "N/A",
        bed=patient.bed,
        admission_status=patient.admission_status,
        admission_date=patient.admission_date,
        max_concurrent_visitors=patient.max_concurrent_visitors,
        max_daily_visitors=patient.max_daily_visitors,
        current_visitors_count=current_count,
        today_visitors_count=today_count,
        can_admit_visitor=can_admit
    )

@router.get("", response_model=List[PatientResponse])
def get_patients(
    search: Optional[str] = Query(None, description="Search by name, hospital number, or room"),
    ward_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    if ward_id:
        query = query.filter(Patient.ward_id == ward_id)
    if status:
        query = query.filter(Patient.admission_status == status)

    patients = query.all()
    results = [enrich_patient(p, db) for p in patients]

    if search:
        s = search.lower().strip()
        results = [
            p for p in results 
            if s in p.full_name.lower() or s in p.hospital_number.lower() or s in p.room_number.lower()
        ]

    return results

@router.get("/{id}", response_model=PatientResponse)
def get_patient(id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return enrich_patient(patient, db)

@router.get("/{id}/capacity", response_model=PatientCapacityStatus)
def get_patient_capacity(id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    current_count = db.query(Visit).filter(
        Visit.patient_id == patient.id,
        Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
    ).count()

    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    today_count = db.query(Visit).filter(
        Visit.patient_id == patient.id,
        Visit.registered_at >= today_start
    ).count()

    allowed = True
    reason = None

    if patient.admission_status != "ADMITTED":
        allowed = False
        reason = "Patient is discharged"
    elif current_count >= patient.max_concurrent_visitors:
        allowed = False
        reason = f"Bedside capacity reached ({current_count}/{patient.max_concurrent_visitors} concurrent visitors)"
    elif today_count >= patient.max_daily_visitors:
        allowed = False
        reason = f"Daily visitor limit reached ({today_count}/{patient.max_daily_visitors} today)"

    return PatientCapacityStatus(
        patient_id=patient.id,
        hospital_number=patient.hospital_number,
        full_name=patient.full_name,
        ward_name=patient.ward.name if patient.ward else "Unassigned",
        room_number=patient.room.room_number if patient.room else "N/A",
        bed=patient.bed,
        current_concurrent_visitors=current_count,
        max_concurrent_visitors=patient.max_concurrent_visitors,
        today_total_visitors=today_count,
        max_daily_visitors=patient.max_daily_visitors,
        allowed_new_visitor=allowed,
        reason=reason
    )
