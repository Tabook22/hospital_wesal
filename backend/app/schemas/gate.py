from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ScanRequest(BaseModel):
    token: str  # secure_token OR pass_code
    checkpoint_id: Optional[int] = None
    checkpoint_code: Optional[str] = None  # CP-01, CP-02, etc.

class ScanResponse(BaseModel):
    result: str  # GRANTED, DENIED
    reason: Optional[str] = None
    checkpoint_code: str
    checkpoint_name: str
    scan_time: datetime
    
    # Details if recognized
    visitor_name: Optional[str] = None
    visitor_type: Optional[str] = None
    pass_code: Optional[str] = None
    patient_name: Optional[str] = None
    patient_hospital_number: Optional[str] = None
    destination_ward: Optional[str] = None
    destination_room: Optional[str] = None
    status: Optional[str] = None
    remaining_minutes: Optional[int] = None
    expected_exit_at: Optional[datetime] = None
    is_checkout: bool = False
    message: str
