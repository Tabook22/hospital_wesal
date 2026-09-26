from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.gate import ScanRequest, ScanResponse
from app.services.access_control_service import process_scan
from app.api.v1.ws import ws_manager

router = APIRouter()

@router.post("/scan", response_model=ScanResponse)
async def scan_gate_token(scan_in: ScanRequest, db: Session = Depends(get_db)):
    result = process_scan(
        db=db,
        token_or_code=scan_in.token,
        checkpoint_id=scan_in.checkpoint_id,
        checkpoint_code=scan_in.checkpoint_code
    )

    # Broadcast live event to all connected dashboards and control room monitors
    await ws_manager.broadcast({
        "type": "GATE_SCAN",
        "data": {
            "result": result["result"],
            "checkpoint_code": result["checkpoint_code"],
            "checkpoint_name": result["checkpoint_name"],
            "visitor_name": result.get("visitor_name"),
            "patient_name": result.get("patient_name"),
            "ward_name": result.get("destination_ward"),
            "status": result.get("status"),
            "is_checkout": result.get("is_checkout", False),
            "reason": result.get("reason"),
            "scan_time": result["scan_time"].isoformat()
        }
    })

    return ScanResponse(**result)
