from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.visit import Visit, VisitorPass
from app.models.hospital import Checkpoint, Ward
from app.models.patient import Patient
from app.models.scan import ScanEvent
from app.models.policy import VisitPolicy
from app.services.timing_engine import calculate_expected_exit, evaluate_visit_status
from app.services.audit_service import log_audit

def process_scan(
    db: Session,
    token_or_code: str,
    checkpoint_id: Optional[int] = None,
    checkpoint_code: Optional[str] = None,
    actor_user_id: Optional[int] = None,
    actor_username: Optional[str] = None
) -> Dict[str, Any]:
    """
    Core Access Control Engine for Sultan Qaboos Hospital Smart Gates.
    Validates QR token, checks visitor policies, capacities, zone restrictions, and records events.
    """
    clean_token = token_or_code.strip()
    
    # 1. Resolve Checkpoint
    checkpoint = None
    if checkpoint_id:
        checkpoint = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_id).first()
    elif checkpoint_code:
        checkpoint = db.query(Checkpoint).filter(Checkpoint.code == checkpoint_code).first()

    if not checkpoint:
        # Default to CP-01 Main Entrance if unspecified
        checkpoint = db.query(Checkpoint).filter(Checkpoint.code == "CP-01").first()

    checkpoint_info = {
        "checkpoint_code": checkpoint.code if checkpoint else "UNKNOWN",
        "checkpoint_name": checkpoint.name if checkpoint else "Unknown Gate",
        "scan_time": datetime.utcnow()
    }

    # 2. Resolve Pass and Visit
    pass_obj = db.query(VisitorPass).filter(
        (VisitorPass.secure_token == clean_token) | 
        (VisitorPass.pass_code == clean_token) |
        (VisitorPass.qr_payload == clean_token)
    ).first()

    if not pass_obj:
        # Log denied attempt for invalid QR
        if checkpoint:
            scan = ScanEvent(
                checkpoint_id=checkpoint.id,
                result="DENIED",
                denial_reason="INVALID QR / PASS NOT FOUND",
                actor_user_id=actor_user_id
            )
            db.add(scan)
            db.commit()
            log_audit(
                db=db,
                action="ACCESS_DENIED",
                entity_type="CHECKPOINT",
                entity_id=str(checkpoint.id),
                details={"reason": "INVALID QR", "token_attempt": clean_token[:12] + "..."}
            )

        return {
            "result": "DENIED",
            "reason": "INVALID QR CODE - PASS NOT RECOGNIZED",
            "message": "The presented QR code is invalid or not registered in the hospital system.",
            **checkpoint_info
        }

    visit: Visit = pass_obj.visit
    patient: Patient = visit.patient
    policy = db.query(VisitPolicy).first()

    # Update visit status first if time has elapsed
    evaluate_visit_status(db, visit, policy)

    details = {
        "visitor_name": visit.visitor.full_name,
        "visitor_type": visit.visitor.visitor_type,
        "pass_code": pass_obj.pass_code,
        "patient_name": patient.full_name,
        "patient_hospital_number": patient.hospital_number,
        "destination_ward": visit.ward.name,
        "destination_room": patient.room.room_number if patient.room else "N/A",
        "status": visit.status,
        "expected_exit_at": visit.expected_exit_at,
        "is_checkout": False
    }

    def record_denial(reason: str, user_msg: str) -> Dict[str, Any]:
        scan = ScanEvent(
            pass_id=pass_obj.id,
            visit_id=visit.id,
            checkpoint_id=checkpoint.id,
            result="DENIED",
            denial_reason=reason,
            actor_user_id=actor_user_id
        )
        db.add(scan)
        db.commit()
        log_audit(
            db=db,
            action="ACCESS_DENIED",
            user_id=actor_user_id,
            username=actor_username,
            entity_type="VISIT",
            entity_id=str(visit.id),
            details={"reason": reason, "checkpoint": checkpoint.name, "pass": pass_obj.pass_code}
        )
        return {
            "result": "DENIED",
            "reason": reason,
            "message": user_msg,
            **checkpoint_info,
            **details
        }

    # 3. Check pass & visit status
    if pass_obj.status == "REVOKED" or visit.status == "CANCELLED":
        return record_denial("PASS REVOKED OR CANCELLED", "This visitor pass has been revoked by administration or cancelled.")

    if pass_obj.status == "USED" or visit.status == "CHECKED_OUT":
        return record_denial("PASS ALREADY USED", "This visitor pass has already been checked out and is permanently invalidated.")

    if pass_obj.status == "EXPIRED":
        return record_denial("PASS EXPIRED", "This visitor pass has expired.")

    # 4. Handle EXIT_GATE (e.g. CP-07)
    if checkpoint.checkpoint_type == "EXIT_GATE":
        if visit.status == "REGISTERED":
            return record_denial("VISITOR NOT CHECKED IN", "Visitor has not checked in at hospital entrance yet.")

        # Successful Checkout
        now = datetime.utcnow()
        visit.checked_out_at = now
        visit.status = "CHECKED_OUT"
        pass_obj.status = "USED"
        visit.last_checkpoint_id = checkpoint.id
        visit.last_checkpoint_name = checkpoint.name
        visit.last_activity_at = now

        scan = ScanEvent(
            pass_id=pass_obj.id,
            visit_id=visit.id,
            checkpoint_id=checkpoint.id,
            result="GRANTED",
            denial_reason=None,
            actor_user_id=actor_user_id
        )
        db.add(scan)
        db.commit()

        log_audit(
            db=db,
            action="CHECK_OUT",
            user_id=actor_user_id,
            username=actor_username,
            entity_type="VISIT",
            entity_id=str(visit.id),
            details={"pass": pass_obj.pass_code, "visitor": visit.visitor.full_name, "checkpoint": checkpoint.name}
        )

        details["status"] = "CHECKED_OUT"
        details["is_checkout"] = True

        return {
            "result": "GRANTED",
            "reason": None,
            "message": "✓ CHECKOUT SUCCESSFUL. Thank you for visiting Sultan Qaboos Hospital.",
            **checkpoint_info,
            **details
        }

    # 5. Handle ENTRY_GATE (e.g. CP-01)
    if checkpoint.checkpoint_type == "ENTRY_GATE":
        # Check duplicate entry
        if visit.status in ["ACTIVE", "ENDING_SOON", "OVERDUE"]:
            return record_denial("DUPLICATE ENTRY", f"Visitor is already checked in (Last seen at {visit.last_checkpoint_name or 'Main Entrance'}).")

        # Check Patient admission status
        if patient.admission_status != "ADMITTED":
            return record_denial("PATIENT DISCHARGED", "Patient has been discharged and is no longer admitted.")

        # Check visiting hours unless in demo mode
        now = datetime.utcnow()
        if not (policy and policy.demo_mode_enabled):
            # Normal mode: check if now is within valid window
            if now < visit.valid_from or now > visit.valid_until:
                return record_denial("OUTSIDE VISITING HOURS", f"Visiting is only authorized between {policy.visiting_start} and {policy.visiting_end}.")

        # Check Bedside Concurrent Visitor Capacity
        current_concurrent = db.query(Visit).filter(
            Visit.patient_id == patient.id,
            Visit.status.in_(["ACTIVE", "ENDING_SOON", "OVERDUE"])
        ).count()

        if current_concurrent >= patient.max_concurrent_visitors:
            return record_denial(
                "MAXIMUM VISITOR CAPACITY REACHED",
                f"Maximum allowed visitors ({current_concurrent}/{patient.max_concurrent_visitors}) are already present at patient bedside."
            )

        # Successful Entry Check-in
        visit.check_in_at = now
        visit.status = "ACTIVE"
        visit.expected_exit_at = calculate_expected_exit(now, visit.max_duration_minutes, visit.valid_until)
        visit.last_checkpoint_id = checkpoint.id
        visit.last_checkpoint_name = checkpoint.name
        visit.last_activity_at = now

        scan = ScanEvent(
            pass_id=pass_obj.id,
            visit_id=visit.id,
            checkpoint_id=checkpoint.id,
            result="GRANTED",
            denial_reason=None,
            actor_user_id=actor_user_id
        )
        db.add(scan)
        db.commit()

        log_audit(
            db=db,
            action="CHECK_IN",
            user_id=actor_user_id,
            username=actor_username,
            entity_type="VISIT",
            entity_id=str(visit.id),
            details={"pass": pass_obj.pass_code, "visitor": visit.visitor.full_name, "checkpoint": checkpoint.name}
        )

        details["status"] = "ACTIVE"
        details["expected_exit_at"] = visit.expected_exit_at
        details["remaining_minutes"] = visit.max_duration_minutes

        return {
            "result": "GRANTED",
            "reason": None,
            "message": "✓ ACCESS GRANTED. Welcome to Sultan Qaboos Hospital.",
            **checkpoint_info,
            **details
        }

    # 6. Handle WARD_CHECKPOINT (e.g. CP-02 Medical Ward A, CP-05 ICU, etc.)
    if checkpoint.checkpoint_type == "WARD_CHECKPOINT":
        # Check if visitor already checked in at entry gate
        if visit.status == "REGISTERED":
            # Auto-check-in if scanning directly at ward in demo mode, or deny
            if policy and policy.demo_mode_enabled:
                now = datetime.utcnow()
                visit.check_in_at = now
                visit.status = "ACTIVE"
                visit.expected_exit_at = calculate_expected_exit(now, visit.max_duration_minutes, visit.valid_until)
            else:
                return record_denial("ENTRY GATE SCAN REQUIRED", "Please scan at Main Entrance (CP-01) before entering hospital wards.")

        # Check Zone Authorization
        if checkpoint.ward_id and checkpoint.ward_id != visit.ward_id:
            assigned_ward = visit.ward.name if visit.ward else "Another Ward"
            return record_denial(
                "NOT AUTHORIZED FOR THIS AREA",
                f"Pass authorized for {assigned_ward} only. Access to {checkpoint.name} is restricted."
            )

        # Check if overdue
        if visit.status == "OVERDUE":
            return record_denial("PASS EXPIRED", "Authorized visiting duration has expired. Please proceed to Exit Gate (CP-07).")

        # Update last known location
        now = datetime.utcnow()
        visit.last_checkpoint_id = checkpoint.id
        visit.last_checkpoint_name = checkpoint.name
        visit.last_activity_at = now

        scan = ScanEvent(
            pass_id=pass_obj.id,
            visit_id=visit.id,
            checkpoint_id=checkpoint.id,
            result="GRANTED",
            denial_reason=None,
            actor_user_id=actor_user_id
        )
        db.add(scan)
        db.commit()

        log_audit(
            db=db,
            action="CHECKPOINT_SCAN",
            user_id=actor_user_id,
            username=actor_username,
            entity_type="VISIT",
            entity_id=str(visit.id),
            details={"pass": pass_obj.pass_code, "checkpoint": checkpoint.name}
        )

        remaining_sec = max(0, int((visit.expected_exit_at - now).total_seconds())) if visit.expected_exit_at else 0
        details["status"] = visit.status
        details["expected_exit_at"] = visit.expected_exit_at
        details["remaining_minutes"] = remaining_sec // 60

        return {
            "result": "GRANTED",
            "reason": None,
            "message": f"✓ ACCESS GRANTED. Access approved for {checkpoint.name}.",
            **checkpoint_info,
            **details
        }

    # Catch-all
    return record_denial("UNSUPPORTED CHECKPOINT", "Checkpoint type is unrecognized.")
