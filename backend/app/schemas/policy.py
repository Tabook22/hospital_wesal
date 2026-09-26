from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PolicyBase(BaseModel):
    visiting_start: str = "17:00"
    visiting_end: str = "19:00"
    default_duration_minutes: int = 20
    warning_threshold_minutes: int = 5
    max_concurrent_per_patient: int = 2
    max_daily_per_patient: int = 6
    companions_allowed: int = 1
    demo_mode_enabled: bool = True
    demo_duration_minutes: int = 2

class PolicyUpdate(PolicyBase):
    pass

class PolicyResponse(PolicyBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
