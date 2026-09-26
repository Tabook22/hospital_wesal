from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    visit_id: Optional[int] = None
    recipient_name: str
    mobile_number: str
    message: str
    notification_type: str
    status: str
    sent_at: datetime

    class Config:
        from_attributes = True

class SendSimulatedNotification(BaseModel):
    recipient_name: str
    mobile_number: str
    message: str
    notification_type: str = "MANUAL_ALERT"
