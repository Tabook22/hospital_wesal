from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TodayReportResponse(BaseModel):
    date: str
    total_registered: int
    total_entries: int
    total_exits: int
    currently_inside: int
    overdue_count: int
    denied_attempts: int
    average_visit_duration_minutes: float
    peak_visiting_hour: str

class WardReportItem(BaseModel):
    ward_name: str
    ward_code: str
    visitors_today: int
    currently_inside: int
    overdue_count: int
    average_duration_minutes: float

class DenialReportItem(BaseModel):
    reason: str
    count: int
    percent: float

class CurrentLiveVisitorItem(BaseModel):
    visitor_name: str
    visitor_type: str
    pass_code: str
    patient_name: str
    patient_hospital_number: str
    ward_name: str
    room_number: str
    last_location: str
    entered_at: Optional[str] = None
    expected_exit_at: Optional[str] = None
    status: str
    remaining_or_overdue_text: str

class CurrentLiveReportResponse(BaseModel):
    generated_at: str
    total_inside: int
    visitors: List[CurrentLiveVisitorItem]
