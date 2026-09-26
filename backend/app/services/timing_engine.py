from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.visit import Visit
from app.models.policy import VisitPolicy
from app.services.notification_service import send_ending_soon_warning, send_overdue_alert
from app.services.audit_service import log_audit

def calculate_expected_exit(check_in_at: datetime, duration_minutes: int, valid_until: datetime) -> datetime:
    """
    Expected exit is the minimum of (check_in_at + duration) AND valid_until.
    Ensures visitors cannot stay past the general visiting hours even if they check in late.
    """
    duration_exit = check_in_at + timedelta(minutes=duration_minutes)
    if duration_exit < valid_until:
        return duration_exit
    return valid_until

def compute_visit_timing_state(visit: Visit) -> Tuple[Optional[int], bool, Optional[int]]:
    """
    Returns (remaining_seconds, is_overdue, overdue_seconds).
    """
    if visit.status == "CHECKED_OUT" or visit.status == "CANCELLED":
        return (0, False, None)
    
    if not visit.expected_exit_at:
        return (None, False, None)

    now = datetime.utcnow()
    diff = (visit.expected_exit_at - now).total_seconds()
    
    if diff <= 0:
        overdue_sec = int(abs(diff))
        return (0, True, overdue_sec)
    else:
        return (int(diff), False, None)

def evaluate_visit_status(db: Session, visit: Visit, policy: Optional[VisitPolicy] = None) -> bool:
    """
    Evaluates and updates the state of a single visit.
    Returns True if state changed.
    """
    if visit.status in ["CHECKED_OUT", "CANCELLED", "REGISTERED"]:
        return False

    if not visit.expected_exit_at:
        return False

    if policy is None:
        policy = db.query(VisitPolicy).first()
    
    # In demo mode with short durations (e.g. 1-2 min), warning threshold is proportionally scaled (e.g. 30 seconds)
    if policy and policy.demo_mode_enabled and (visit.max_duration_minutes <= 2):
        warning_seconds = 30
    else:
        warning_minutes = policy.warning_threshold_minutes if policy else 5
        warning_seconds = warning_minutes * 60

    now = datetime.utcnow()
    time_remaining_sec = (visit.expected_exit_at - now).total_seconds()
    state_changed = False

    if time_remaining_sec <= 0:
        if visit.status != "OVERDUE":
            visit.status = "OVERDUE"
            state_changed = True
            
            # Send overdue notification if not already sent
            send_overdue_alert(db, visit)
            log_audit(
                db=db,
                action="VISITOR_OVERDUE",
                entity_type="VISIT",
                entity_id=str(visit.id),
                details={"visitor": visit.visitor.full_name, "expected_exit": visit.expected_exit_at.isoformat()}
            )
    elif time_remaining_sec <= warning_seconds:
        if visit.status == "ACTIVE":
            visit.status = "ENDING_SOON"
            state_changed = True

            # Send 5-minute warning notification
            send_ending_soon_warning(db, visit)
            log_audit(
                db=db,
                action="WARNING_SENT",
                entity_type="VISIT",
                entity_id=str(visit.id),
                details={"visitor": visit.visitor.full_name, "time_left_sec": int(time_remaining_sec)}
            )

    if state_changed:
        db.commit()

    return state_changed

def evaluate_all_active_visits(db: Session) -> int:
    """
    Evaluates all currently inside visits (ACTIVE, ENDING_SOON, OVERDUE) and updates them.
    Returns count of updated visits.
    """
    policy = db.query(VisitPolicy).first()
    active_visits = db.query(Visit).filter(
        Visit.status.in_(["ACTIVE", "ENDING_SOON"])
    ).all()

    updated_count = 0
    for v in active_visits:
        if evaluate_visit_status(db, v, policy):
            updated_count += 1

    return updated_count
