from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PatientBase(BaseModel):
    hospital_number: str
    full_name: str
    civil_id: Optional[str] = None
    gender: str
    ward_id: int
    room_id: int
    bed: str
    admission_status: str = "ADMITTED"
    max_concurrent_visitors: int = 2
    max_daily_visitors: int = 6

class PatientResponse(PatientBase):
    id: int
    admission_date: datetime
    ward_name: Optional[str] = None
    room_number: Optional[str] = None
    current_visitors_count: int = 0
    today_visitors_count: int = 0
    can_admit_visitor: bool = True

    class Config:
        from_attributes = True

class PatientCapacityStatus(BaseModel):
    patient_id: int
    hospital_number: str
    full_name: str
    ward_name: str
    room_number: str
    bed: str
    current_concurrent_visitors: int
    max_concurrent_visitors: int
    today_total_visitors: int
    max_daily_visitors: int
    allowed_new_visitor: bool
    reason: Optional[str] = None
