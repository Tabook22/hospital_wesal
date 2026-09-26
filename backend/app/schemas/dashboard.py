from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.schemas.visit import VisitResponse

class DashboardKPIs(BaseModel):
    visitors_inside: int
    visitors_today: int
    checked_out: int
    overdue: int
    denied_entries: int
    active_passes: int

class HourlyActivity(BaseModel):
    hour: str
    entries: int
    exits: int

class WardOccupancy(BaseModel):
    ward_name: str
    code: str
    current_inside: int
    capacity: int
    percent: float

class DenialBreakdown(BaseModel):
    reason: str
    count: int

class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    hourly_activity: List[HourlyActivity]
    ward_occupancy: List[WardOccupancy]
    denial_breakdown: List[DenialBreakdown]
    average_visit_minutes: float
    peak_visiting_hour: str
    current_occupancy_rate: float
    active_visitors: List[VisitResponse]
