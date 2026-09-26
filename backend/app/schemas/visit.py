from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VisitorPassResponse(BaseModel):
    id: int
    visit_id: int
    pass_code: str
    secure_token: str
    qr_payload: str
    qr_image_base64: Optional[str] = None
    status: str
    generated_at: datetime
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VisitCreate(BaseModel):
    patient_id: int
    # Visitor can be existing visitor_id OR new visitor fields
    visitor_id: Optional[int] = None
    full_name: Optional[str] = None
    civil_id: Optional[str] = None
    mobile_number: Optional[str] = None
    visitor_type: str = "VISITOR"
    relationship_to_patient: Optional[str] = None
    notes: Optional[str] = None

    # Timing parameters
    service_type: str = "PATIENT_VISIT"
    duration_minutes: Optional[int] = None  # None = use policy default or demo setting

class VisitResponse(BaseModel):
    id: int
    visit_number: str
    patient_id: int
    patient_name: str
    patient_hospital_number: str
    patient_room: str
    patient_bed: str
    visitor_id: int
    visitor_name: str
    visitor_civil_id: str
    visitor_mobile: str
    visitor_type: str
    ward_id: int
    ward_name: str
    service_type: str
    status: str
    registered_at: datetime
    valid_from: datetime
    valid_until: datetime
    max_duration_minutes: int
    check_in_at: Optional[datetime] = None
    expected_exit_at: Optional[datetime] = None
    checked_out_at: Optional[datetime] = None
    last_checkpoint_name: Optional[str] = None
    last_activity_at: Optional[datetime] = None
    pass_obj: Optional[VisitorPassResponse] = None

    # Dynamic computed fields
    remaining_seconds: Optional[int] = None
    is_overdue: bool = False
    overdue_seconds: Optional[int] = None

    class Config:
        from_attributes = True

class VisitCheckoutResponse(BaseModel):
    visit_id: int
    visit_number: str
    visitor_name: str
    checked_out_at: datetime
    status: str
    message: str
