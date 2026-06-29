"""
Notification Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from config.database import get_db
from middleware.auth import get_current_user
from models.notification import Notification, NotificationStatus
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_notifications(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    status_filter: str = None,
    type_filter: str = None
):
    """List notifications for current user"""
    query = db.query(Notification).filter(
        Notification.org_id == current_user.org_id,
        Notification.user_id == current_user.id
    )
    
    if status_filter:
        query = query.filter(Notification.status == status_filter)
    if type_filter:
        query = query.filter(Notification.type == type_filter)
    
    notifications = query.order_by(Notification.created_at.desc()).all()
    return notifications


@router.get("/{notification_id}")
async def get_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get notification details"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.org_id == current_user.org_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return notification


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.org_id == current_user.org_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.status = NotificationStatus.READ
    notification.read_at = datetime.utcnow()
    db.commit()
    db.refresh(notification)
    
    return notification


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.org_id == current_user.org_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}


@router.post("/send")
async def send_notification(
    notification_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send notification to user"""
    notification = Notification(
        id=f"notif_{datetime.utcnow().timestamp()}",
        org_id=current_user.org_id,
        user_id=notification_data.get("user_id"),
        type=notification_data.get("type"),
        title=notification_data.get("title"),
        message=notification_data.get("message"),
        data=notification_data.get("data", {}),
        status=NotificationStatus.UNREAD,
        created_at=datetime.utcnow()
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification
