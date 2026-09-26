from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification

class BaseNotificationProvider(ABC):
    @abstractmethod
    def send_sms(self, recipient_name: str, mobile_number: str, message: str) -> bool:
        pass

class SimulatedSMSProvider(BaseNotificationProvider):
    """Simulates real-world SMS dispatch without requiring third-party credentials."""
    def send_sms(self, recipient_name: str, mobile_number: str, message: str) -> bool:
        # In a real environment with Twilio or Omani Telecom (Omantel/Ooredoo SMS Gateway),
        # API call would happen here. For PoC, it immediately succeeds.
        return True

notification_provider: BaseNotificationProvider = SimulatedSMSProvider()

def create_notification(
    db: Session,
    recipient_name: str,
    mobile_number: str,
    message: str,
    notification_type: str,
    visit_id: Optional[int] = None,
    status: str = "SIMULATED"
) -> Notification:
    # Send via provider
    success = notification_provider.send_sms(recipient_name, mobile_number, message)
    delivery_status = status if success else "FAILED"

    notification = Notification(
        visit_id=visit_id,
        recipient_name=recipient_name,
        mobile_number=mobile_number,
        message=message,
        notification_type=notification_type,
        status=delivery_status,
        sent_at=datetime.utcnow()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def send_ending_soon_warning(db: Session, visit) -> Notification:
    msg = (
        f"Dear {visit.visitor.full_name},\n"
        f"your visiting period at Sultan Qaboos Hospital will end in 5 minutes. "
        f"Please prepare to conclude your visit and exit the ward.\n"
        f"Wesal – Sultan Qaboos Hospital"
    )
    return create_notification(
        db=db,
        recipient_name=visit.visitor.full_name,
        mobile_number=visit.visitor.mobile_number,
        message=msg,
        notification_type="WARNING_5MIN",
        visit_id=visit.id,
        status="SENT"
    )

def send_overdue_alert(db: Session, visit) -> Notification:
    msg = (
        f"Dear {visit.visitor.full_name},\n"
        f"your authorized visiting period has ended. "
        f"Please proceed immediately to the hospital exit gate (CP-07). "
        f"Thank you for your cooperation.\n"
        f"Wesal – Sultan Qaboos Hospital"
    )
    return create_notification(
        db=db,
        recipient_name=visit.visitor.full_name,
        mobile_number=visit.visitor.mobile_number,
        message=msg,
        notification_type="OVERDUE",
        visit_id=visit.id,
        status="SENT"
    )

def send_pass_issued_notification(db: Session, visit) -> Notification:
    pass_code = visit.pass_obj.pass_code if visit.pass_obj else "WESAL"
    msg = (
        f"Welcome to Sultan Qaboos Hospital, {visit.visitor.full_name}. "
        f"Your visitor pass {pass_code} is active for {visit.ward.name}. "
        f"Please scan at checkpoints upon entry and exit.\n"
        f"Wesal Access System"
    )
    return create_notification(
        db=db,
        recipient_name=visit.visitor.full_name,
        mobile_number=visit.visitor.mobile_number,
        message=msg,
        notification_type="PASS_ISSUED",
        visit_id=visit.id,
        status="SENT"
    )
