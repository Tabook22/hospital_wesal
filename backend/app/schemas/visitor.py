from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VisitorBase(BaseModel):
    full_name: str
    civil_id: str
    mobile_number: str
    visitor_type: str = "VISITOR"  # VISITOR, COMPANION
    relationship_to_patient: Optional[str] = None
    notes: Optional[str] = None

class VisitorCreate(VisitorBase):
    pass

class VisitorResponse(VisitorBase):
    id: int
    created_at: datetime
    active_visit_id: Optional[int] = None
    active_visit_status: Optional[str] = None

    class Config:
        from_attributes = True

class VisitorTimelineEvent(BaseModel):
    timestamp: datetime
    checkpoint_name: Optional[str] = None
    event_type: str
    description: str
    status: str

class VisitorDetailResponse(VisitorResponse):
    total_visits: int = 0
    timeline: List[VisitorTimelineEvent] = []
