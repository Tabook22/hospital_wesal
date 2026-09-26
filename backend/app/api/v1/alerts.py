from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, SendSimulatedNotification
from app.services.notification_service import create_notification
from app.api.v1.ws import ws_manager

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
def get_alerts(
    notification_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    if status:
        query = query.filter(Notification.status == status)

    notifications = query.order_by(Notification.sent_at.desc()).limit(limit).all()
    return notifications

@router.post("/simulate", response_model=NotificationResponse)
async def simulate_send_alert(alert_in: SendSimulatedNotification, db: Session = Depends(get_db)):
    notification = create_notification(
        db=db,
        recipient_name=alert_in.recipient_name,
        mobile_number=alert_in.mobile_number,
        message=alert_in.message,
        notification_type=alert_in.notification_type,
        status="SENT"
    )

    await ws_manager.broadcast({
        "type": "NEW_ALERT",
        "notification_id": notification.id,
        "recipient_name": notification.recipient_name,
        "notification_type": notification.notification_type,
        "message": notification.message
    })

    return notification
