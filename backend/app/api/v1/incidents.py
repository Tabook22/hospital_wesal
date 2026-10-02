from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.models.incident import StaffIncident
from app.models.user import User
from app.schemas.incident import (
    StaffIncidentCreate,
    StaffIncidentUpdate,
    StaffIncidentResponse,
    IncidentStats,
)
from app.services.audit_service import log_audit_event
from app.api.v1.ws import ws_manager

router = APIRouter(prefix="/incidents", tags=["Staff Incidents & Messaging"])

@router.get("", response_model=List[StaffIncidentResponse])
def get_incidents(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, DISPATCHED, RESOLVED, DISMISSED"),
    severity: Optional[str] = Query(None, description="Filter by severity: URGENT, HIGH, MEDIUM, LOW"),
    category: Optional[str] = Query(None, description="Filter by category"),
    ward_name: Optional[str] = Query(None, description="Filter by ward name"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieve hospital staff incident reports and employee visitor comments."""
    query = db.query(StaffIncident)
    
    if status and status.upper() != "ALL":
        query = query.filter(StaffIncident.status == status.upper())
    if severity and severity.upper() != "ALL":
        query = query.filter(StaffIncident.severity == severity.upper())
    if category and category.upper() != "ALL":
        query = query.filter(StaffIncident.category == category.upper())
    if ward_name and ward_name.upper() != "ALL":
        query = query.filter(StaffIncident.ward_name.ilike(f"%{ward_name}%"))
        
    incidents = query.order_by(
        # Put URGENT & OPEN incidents first
        (StaffIncident.status == "OPEN").desc(),
        (StaffIncident.severity == "URGENT").desc(),
        StaffIncident.created_at.desc()
    ).limit(limit).all()
    
    return incidents

@router.get("/stats", response_model=IncidentStats)
def get_incident_stats(db: Session = Depends(get_db)):
    """Summary KPI metrics for incidents."""
    today_start = datetime.combine(date.today(), datetime.min.time())
    
    total_today = db.query(StaffIncident).filter(StaffIncident.created_at >= today_start).count()
    open_count = db.query(StaffIncident).filter(StaffIncident.status == "OPEN").count()
    urgent_count = db.query(StaffIncident).filter(
        StaffIncident.status.in_(["OPEN", "DISPATCHED"]),
        StaffIncident.severity == "URGENT"
    ).count()
    dispatched_count = db.query(StaffIncident).filter(StaffIncident.status == "DISPATCHED").count()
    resolved_today_count = db.query(StaffIncident).filter(
        StaffIncident.status == "RESOLVED",
        StaffIncident.resolved_at >= today_start
    ).count()
    
    return IncidentStats(
        total_today=total_today,
        open_count=open_count,
        urgent_count=urgent_count,
        dispatched_count=dispatched_count,
        resolved_today_count=resolved_today_count
    )

@router.get("/{incident_id}", response_model=StaffIncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(StaffIncident).filter(StaffIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.post("", response_model=StaffIncidentResponse)
async def create_incident(
    payload: StaffIncidentCreate,
    db: Session = Depends(get_db)
):
    """
    Hospital employee files an urgent notice / visitor comment.
    Generates incident tracking code and broadcasts live via WebSocket to Reception/Admin.
    """
    # Generate unique incident number: INC-YYYY-XXXX
    year = datetime.utcnow().year
    count_this_year = db.query(StaffIncident).filter(
        StaffIncident.incident_number.like(f"INC-{year}-%")
    ).count() + 1
    incident_number = f"INC-{year}-{count_this_year:04d}"

    incident = StaffIncident(
        incident_number=incident_number,
        reporter_name=payload.reporter_name,
        reporter_role=payload.reporter_role.upper(),
        category=payload.category.upper(),
        severity=payload.severity.upper(),
        ward_id=payload.ward_id,
        ward_name=payload.ward_name,
        location_details=payload.location_details,
        visitor_name=payload.visitor_name,
        pass_code=payload.pass_code,
        patient_id=payload.patient_id,
        patient_name=payload.patient_name,
        title=payload.title,
        description=payload.description,
        suggested_action=payload.suggested_action,
        status="OPEN"
    )
    
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Audit logging
    log_audit_event(
        db=db,
        action="INCIDENT_REPORTED",
        description=f"Staff {payload.reporter_name} ({payload.reporter_role}) reported {payload.severity} incident in {payload.ward_name}: {payload.title}",
        user_name=payload.reporter_name,
        user_role=payload.reporter_role
    )

    # Real-time WebSocket Broadcast to all active consoles (Admin, Reception, Security)
    await ws_manager.broadcast({
        "type": "INCIDENT_REPORTED",
        "incident": {
            "id": incident.id,
            "incident_number": incident.incident_number,
            "title": incident.title,
            "category": incident.category,
            "severity": incident.severity,
            "ward_name": incident.ward_name,
            "location_details": incident.location_details,
            "reporter_name": incident.reporter_name,
            "reporter_role": incident.reporter_role,
            "created_at": incident.created_at.isoformat()
        }
    })

    return incident

@router.put("/{incident_id}/status", response_model=StaffIncidentResponse)
async def update_incident_status(
    incident_id: int,
    payload: StaffIncidentUpdate,
    db: Session = Depends(get_db)
):
    """
    Administration or security marks an incident as DISPATCHED, RESOLVED, or DISMISSED,
    and logs notes regarding action taken.
    """
    incident = db.query(StaffIncident).filter(StaffIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    new_status = payload.status.upper()
    incident.status = new_status
    if payload.admin_notes:
        incident.admin_notes = payload.admin_notes
    if payload.resolved_by:
        incident.resolved_by = payload.resolved_by
        
    if new_status in ["RESOLVED", "DISMISSED"]:
        incident.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(incident)

    # Audit logging
    log_audit_event(
        db=db,
        action=f"INCIDENT_{new_status}",
        description=f"Incident {incident.incident_number} updated to {new_status} by {payload.resolved_by or 'Admin'}. Notes: {payload.admin_notes or 'None'}",
        user_name=payload.resolved_by or "Hospital Admin",
        user_role="ADMIN"
    )

    # Broadcast update live
    await ws_manager.broadcast({
        "type": "INCIDENT_STATUS_CHANGED",
        "incident_id": incident.id,
        "incident_number": incident.incident_number,
        "new_status": incident.status,
        "admin_notes": incident.admin_notes,
        "resolved_by": incident.resolved_by
    })

    return incident
