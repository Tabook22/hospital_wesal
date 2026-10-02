from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class VisitorRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    mobile_number: str = Field(..., min_length=7, max_length=20)
    civil_id: str = Field(..., min_length=4, max_length=30)

class VisitorPatientSearchItem(BaseModel):
    id: int
    hospital_number: str
    full_name: str
    masked_name: str
    arabic_name: Optional[str] = None
    masked_arabic_name: Optional[str] = None
    visitation_category: str = "ALLOWED"  # ALLOWED, LIMITED, PROHIBITED
    ward_name: str
    room_number: str
    bed: str
    admission_status: str
    can_admit_visitor: bool
    current_concurrent_visitors: int
    max_concurrent_visitors: int
    visiting_hours: str

class VisitorPassBookRequest(BaseModel):
    patient_id: int
    visitor_type: str = "VISITOR"  # VISITOR or COMPANION
    relationship: str = "FIRST_DEGREE"  # FIRST_DEGREE, SECOND_DEGREE, EXTENDED_FAMILY, FRIEND, COMPANION
    relationship_details: Optional[str] = None
    duration_minutes: int = 20
    notes: Optional[str] = None

class VisitorExpressBookRequest(BaseModel):
    patient_id: int
    full_name: str = Field(..., min_length=2, max_length=100)
    civil_id: str = Field(..., min_length=4, max_length=30)
    mobile_number: str = Field(..., min_length=6, max_length=25)
    visitor_type: str = "VISITOR"  # VISITOR or COMPANION
    relationship: str = "FIRST_DEGREE"  # FIRST_DEGREE, SECOND_DEGREE, EXTENDED_FAMILY, FRIEND, COMPANION
    duration_minutes: int = 20
    notes: Optional[str] = None

class VisitorPassDetail(BaseModel):
    visit_id: int
    visit_number: str
    pass_code: str
    secure_token: str
    qr_payload: str
    qr_image_base64: str
    visitor_name: str
    visitor_civil_id: str
    visitor_mobile: str
    visitor_type: str
    relationship: Optional[str] = None
    patient_name: str
    patient_hospital_number: str
    ward_name: str
    room_number: str
    bed: str
    valid_from: datetime
    valid_until: datetime
    max_duration_minutes: int
    status: str  # PENDING_APPROVAL, REGISTERED, ACTIVE, etc.
    approval_status: str = "APPROVED"  # APPROVED, PENDING_APPROVAL, REJECTED
    rejection_reason: Optional[str] = None
    generated_at: datetime
    access_token: Optional[str] = None

