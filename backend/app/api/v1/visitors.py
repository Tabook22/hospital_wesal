from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.visitor import Visitor
from app.models.visit import Visit
from app.models.scan import ScanEvent
from app.models.notification import Notification
from app.schemas.visitor import VisitorResponse, VisitorCreate, VisitorDetailResponse, VisitorTimelineEvent
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("", response_model=List[VisitorResponse])
def get_visitors(
    search: Optional[str] = Query(None, description="Search by name, civil ID, or phone"),
    visitor_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Visitor)
    if visitor_type:
        query = query.filter(Visitor.visitor_type == visitor_type)
    
    visitors = query.order_by(Visitor.created_at.desc()).all()
    
    results = []
    for v in visitors:
        # Check active visit
        active_visit = db.query(Visit).filter(
            Visit.visitor_id == v.id,
            Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE", "REGISTERED"])
        ).first()

        results.append(VisitorResponse(
            id=v.id,
            full_name=v.full_name,
            civil_id=v.civil_id,
            mobile_number=v.mobile_number,
            visitor_type=v.visitor_type,
            relationship_to_patient=v.relationship_to_patient,
            notes=v.notes,
            created_at=v.created_at,
            active_visit_id=active_visit.id if active_visit else None,
            active_visit_status=active_visit.status if active_visit else None
        ))

    if search:
        s = search.lower().strip()
        results = [
            r for r in results
            if s in r.full_name.lower() or s in r.civil_id.lower() or s in r.mobile_number.lower()
        ]

    return results

@router.post("", response_model=VisitorResponse)
def create_visitor(visitor_in: VisitorCreate, db: Session = Depends(get_db)):
    # Check if visitor already exists by civil_id
    existing = db.query(Visitor).filter(Visitor.civil_id == visitor_in.civil_id.strip()).first()
    if existing:
        # Update details if needed
        existing.full_name = visitor_in.full_name.strip()
        existing.mobile_number = visitor_in.mobile_number.strip()
        existing.visitor_type = visitor_in.visitor_type
        existing.relationship_to_patient = visitor_in.relationship_to_patient
        existing.notes = visitor_in.notes
        db.commit()
        db.refresh(existing)
        return VisitorResponse(
            id=existing.id,
            full_name=existing.full_name,
            civil_id=existing.civil_id,
            mobile_number=existing.mobile_number,
            visitor_type=existing.visitor_type,
            relationship_to_patient=existing.relationship_to_patient,
            notes=existing.notes,
            created_at=existing.created_at
        )

    visitor = Visitor(
        full_name=visitor_in.full_name.strip(),
        civil_id=visitor_in.civil_id.strip(),
        mobile_number=visitor_in.mobile_number.strip(),
        visitor_type=visitor_in.visitor_type,
        relationship_to_patient=visitor_in.relationship_to_patient,
        notes=visitor_in.notes,
        created_at=datetime.utcnow()
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)

    log_audit(
        db=db,
        action="VISITOR_CREATED",
        entity_type="VISITOR",
        entity_id=str(visitor.id),
        details={"name": visitor.full_name, "civil_id": visitor.civil_id}
    )

    return VisitorResponse(
        id=visitor.id,
        full_name=visitor.full_name,
        civil_id=visitor.civil_id,
        mobile_number=visitor.mobile_number,
        visitor_type=visitor.visitor_type,
        relationship_to_patient=visitor.relationship_to_patient,
        notes=visitor.notes,
        created_at=visitor.created_at
    )

@router.get("/{id}", response_model=VisitorDetailResponse)
def get_visitor_detail(id: int, db: Session = Depends(get_db)):
    visitor = db.query(Visitor).filter(Visitor.id == id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    visits = db.query(Visit).filter(Visit.visitor_id == visitor.id).order_by(Visit.registered_at.desc()).all()
    
    active_visit = next((v for v in visits if v.status in ["ACTIVE", "ENDING_SOON", "OVERDUE", "REGISTERED"]), None)

    # Build chronological timeline from visits, scans, and notifications
    timeline_events: List[VisitorTimelineEvent] = []

    for v in visits:
        timeline_events.append(VisitorTimelineEvent(
            timestamp=v.registered_at,
            checkpoint_name="Reception Desk",
            event_type="REGISTRATION",
            description=f"Visit {v.visit_number} registered for patient {v.patient.full_name} ({v.ward.name})",
            status="SUCCESS"
        ))

        if v.pass_obj:
            timeline_events.append(VisitorTimelineEvent(
                timestamp=v.pass_obj.generated_at,
                checkpoint_name="Pass Generator",
                event_type="PASS_ISSUED",
                description=f"QR Visitor Pass {v.pass_obj.pass_code} issued",
                status="SUCCESS"
            ))

        # Scan events
        for scan in v.scans:
            chk_name = scan.checkpoint.name if scan.checkpoint else "Smart Gate"
            if scan.result == "GRANTED":
                desc = f"Access granted at {chk_name}"
                if scan.checkpoint and scan.checkpoint.checkpoint_type == "EXIT_GATE":
                    desc = f"Checked out successfully at {chk_name}"
                elif scan.checkpoint and scan.checkpoint.checkpoint_type == "ENTRY_GATE":
                    desc = f"Checked in through {chk_name}"
            else:
                desc = f"Access denied at {chk_name} (Reason: {scan.denial_reason})"

            timeline_events.append(VisitorTimelineEvent(
                timestamp=scan.scan_time,
                checkpoint_name=chk_name,
                event_type="SCAN_" + scan.result,
                description=desc,
                status=scan.result
            ))

        # Notifications
        for n in v.notifications:
            timeline_events.append(VisitorTimelineEvent(
                timestamp=n.sent_at,
                checkpoint_name="SMS Alert System",
                event_type=n.notification_type,
                description=f"Alert dispatched: {n.message[:60]}...",
                status="SENT"
            ))

    # Sort timeline chronologically descending (newest first)
    timeline_events.sort(key=lambda x: x.timestamp, reverse=True)

    return VisitorDetailResponse(
        id=visitor.id,
        full_name=visitor.full_name,
        civil_id=visitor.civil_id,
        mobile_number=visitor.mobile_number,
        visitor_type=visitor.visitor_type,
        relationship_to_patient=visitor.relationship_to_patient,
        notes=visitor.notes,
        created_at=visitor.created_at,
        active_visit_id=active_visit.id if active_visit else None,
        active_visit_status=active_visit.status if active_visit else None,
        total_visits=len(visits),
        timeline=timeline_events
    )
