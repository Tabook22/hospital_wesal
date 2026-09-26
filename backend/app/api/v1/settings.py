from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.policy import VisitPolicy
from app.schemas.policy import PolicyResponse, PolicyUpdate
from app.services.audit_service import log_audit
from app.api.v1.ws import ws_manager

router = APIRouter()

@router.get("", response_model=PolicyResponse)
def get_settings(db: Session = Depends(get_db)):
    policy = db.query(VisitPolicy).first()
    if not policy:
        policy = VisitPolicy(
            visiting_start="17:00",
            visiting_end="19:00",
            default_duration_minutes=20,
            warning_threshold_minutes=5,
            max_concurrent_per_patient=2,
            max_daily_per_patient=6,
            companions_allowed=1,
            demo_mode_enabled=True,
            demo_duration_minutes=2
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy

@router.put("", response_model=PolicyResponse)
async def update_settings(policy_in: PolicyUpdate, db: Session = Depends(get_db)):
    policy = db.query(VisitPolicy).first()
    if not policy:
        policy = VisitPolicy()
        db.add(policy)

    policy.visiting_start = policy_in.visiting_start
    policy.visiting_end = policy_in.visiting_end
    policy.default_duration_minutes = policy_in.default_duration_minutes
    policy.warning_threshold_minutes = policy_in.warning_threshold_minutes
    policy.max_concurrent_per_patient = policy_in.max_concurrent_per_patient
    policy.max_daily_per_patient = policy_in.max_daily_per_patient
    policy.companions_allowed = policy_in.companions_allowed
    policy.demo_mode_enabled = policy_in.demo_mode_enabled
    policy.demo_duration_minutes = policy_in.demo_duration_minutes
    policy.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(policy)

    log_audit(
        db=db,
        action="SETTINGS_CHANGED",
        entity_type="POLICY",
        entity_id=str(policy.id),
        details={"demo_mode": policy.demo_mode_enabled, "duration": policy.default_duration_minutes}
    )

    await ws_manager.broadcast({
        "type": "POLICY_UPDATED",
        "demo_mode": policy.demo_mode_enabled,
        "demo_duration": policy.demo_duration_minutes
    })

    return policy
