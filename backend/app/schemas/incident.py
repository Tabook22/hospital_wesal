from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class StaffIncidentCreate(BaseModel):
    category: str = Field(..., description="UNAUTHORIZED_AREA, NOISE_DISTURBANCE, OVERCROWDING, URGENT_ACTION, VISITING_HOURS_VIOLATION, BEHAVIORAL_ISSUE, OTHER")
    severity: str = Field(default="HIGH", description="URGENT, HIGH, MEDIUM, LOW")
    ward_id: Optional[int] = None
    ward_name: str = Field(..., description="Name of the ward or department")
    location_details: Optional[str] = Field(None, description="Room number, bed, corridor")
    
    reporter_name: str = Field(..., description="Name of reporting employee")
    reporter_role: str = Field(default="NURSE", description="Role: NURSE, DOCTOR, SECURITY, WARD_SUPERVISOR, ADMIN")
    
    visitor_name: Optional[str] = None
    pass_code: Optional[str] = None
    patient_name: Optional[str] = None
    patient_id: Optional[int] = None
    
    title: str = Field(..., description="Brief headline of the incident")
    description: str = Field(..., description="Detailed observation by the employee")
    suggested_action: Optional[str] = Field(None, description="Suggested action for admin/security")

class StaffIncidentUpdate(BaseModel):
    status: str = Field(..., description="OPEN, DISPATCHED, RESOLVED, DISMISSED")
    admin_notes: Optional[str] = Field(None, description="Action taken or instructions")
    resolved_by: Optional[str] = Field(None, description="Name of the resolving admin or security officer")

class StaffIncidentResponse(BaseModel):
    id: int
    incident_number: str
    reporter_id: Optional[int] = None
    reporter_name: str
    reporter_role: str
    category: str
    severity: str
    ward_id: Optional[int] = None
    ward_name: str
    location_details: Optional[str] = None
    visitor_id: Optional[int] = None
    visitor_name: Optional[str] = None
    pass_code: Optional[str] = None
    patient_id: Optional[int] = None
    patient_name: Optional[str] = None
    title: str
    description: str
    suggested_action: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentStats(BaseModel):
    total_today: int
    open_count: int
    urgent_count: int
    dispatched_count: int
    resolved_today_count: int
