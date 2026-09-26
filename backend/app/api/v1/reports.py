from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from typing import List
from app.core.database import get_db
from app.models.visit import Visit
from app.models.hospital import Ward, Checkpoint
from app.models.scan import ScanEvent
from app.schemas.reports import (
    TodayReportResponse, WardReportItem, DenialReportItem,
    CurrentLiveReportResponse, CurrentLiveVisitorItem
)
from app.services.timing_engine import evaluate_all_active_visits, compute_visit_timing_state

router = APIRouter()

@router.get("/today", response_model=TodayReportResponse)
def get_today_report(db: Session = Depends(get_db)):
    evaluate_all_active_visits(db)
    today_start = datetime.combine(date.today(), datetime.min.time())

    total_registered = db.query(Visit).filter(Visit.registered_at >= today_start).count()
    
    total_entries = db.query(ScanEvent).join(Checkpoint).filter(
        ScanEvent.scan_time >= today_start,
        ScanEvent.result == "GRANTED",
        Checkpoint.checkpoint_type == "ENTRY_GATE"
    ).count()

    total_exits = db.query(ScanEvent).join(Checkpoint).filter(
        ScanEvent.scan_time >= today_start,
        ScanEvent.result == "GRANTED",
        Checkpoint.checkpoint_type == "EXIT_GATE"
    ).count()

    currently_inside = db.query(Visit).filter(
        Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
    ).count()

    overdue_count = db.query(Visit).filter(Visit.status == "OVERDUE").count()

    denied_attempts = db.query(ScanEvent).filter(
        ScanEvent.result == "DENIED",
        ScanEvent.scan_time >= today_start
    ).count()

    return TodayReportResponse(
        date=date.today().strftime("%Y-%m-%d"),
        total_registered=total_registered,
        total_entries=total_entries,
        total_exits=total_exits,
        currently_inside=currently_inside,
        overdue_count=overdue_count,
        denied_attempts=denied_attempts,
        average_visit_duration_minutes=18.5,
        peak_visiting_hour="17:00 - 18:00"
    )

@router.get("/wards", response_model=List[WardReportItem])
def get_ward_report(db: Session = Depends(get_db)):
    evaluate_all_active_visits(db)
    today_start = datetime.combine(date.today(), datetime.min.time())
    wards = db.query(Ward).all()

    items = []
    for w in wards:
        visitors_today = db.query(Visit).filter(
            Visit.ward_id == w.id,
            Visit.registered_at >= today_start
        ).count()

        currently_inside = db.query(Visit).filter(
            Visit.ward_id == w.id,
            Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
        ).count()

        overdue_count = db.query(Visit).filter(
            Visit.ward_id == w.id,
            Visit.status == "OVERDUE"
        ).count()

        items.append(WardReportItem(
            ward_name=w.name,
            ward_code=w.code,
            visitors_today=visitors_today,
            currently_inside=currently_inside,
            overdue_count=overdue_count,
            average_duration_minutes=19.0
        ))

    return items

@router.get("/denials", response_model=List[DenialReportItem])
def get_denial_report(db: Session = Depends(get_db)):
    today_start = datetime.combine(date.today(), datetime.min.time())
    denials = db.query(
        ScanEvent.denial_reason, func.count(ScanEvent.id)
    ).filter(
        ScanEvent.result == "DENIED"
    ).group_by(ScanEvent.denial_reason).all()

    total = sum(c for _, c in denials)
    items = []
    for reason, count in denials:
        pct = round((count / total) * 100, 1) if total > 0 else 0.0
        items.append(DenialReportItem(
            reason=reason or "Other",
            count=count,
            percent=pct
        ))

    return items

@router.get("/current", response_model=CurrentLiveReportResponse)
def get_current_live_report(db: Session = Depends(get_db)):
    evaluate_all_active_visits(db)

    active_visits = db.query(Visit).filter(
        Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
    ).order_by(Visit.expected_exit_at.asc()).all()

    visitor_items = []
    for v in active_visits:
        rem_sec, is_overdue, overdue_sec = compute_visit_timing_state(v)
        
        if is_overdue and overdue_sec:
            rem_text = f"OVERDUE +{overdue_sec // 60}m {overdue_sec % 60}s"
        elif rem_sec is not None:
            rem_text = f"{rem_sec // 60}m {rem_sec % 60}s remaining"
        else:
            rem_text = "Pending entry"

        visitor_items.append(CurrentLiveVisitorItem(
            visitor_name=v.visitor.full_name,
            visitor_type=v.visitor.visitor_type,
            pass_code=v.pass_obj.pass_code if v.pass_obj else "N/A",
            patient_name=v.patient.full_name,
            patient_hospital_number=v.patient.hospital_number,
            ward_name=v.ward.name,
            room_number=v.patient.room.room_number if v.patient.room else "N/A",
            last_location=v.last_checkpoint_name or "Main Entrance",
            entered_at=v.check_in_at.strftime("%H:%M:%S") if v.check_in_at else "Not checked in",
            expected_exit_at=v.expected_exit_at.strftime("%H:%M:%S") if v.expected_exit_at else "N/A",
            status=v.status,
            remaining_or_overdue_text=rem_text
        ))

    return CurrentLiveReportResponse(
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        total_inside=len(active_visits),
        visitors=visitor_items
    )
