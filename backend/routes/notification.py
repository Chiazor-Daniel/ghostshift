"""Notification routes — production ready."""
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user
from models.notification import Notification

logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize(n: Notification) -> dict:
    return {
        "id": n.id,
        "org_id": n.org_id,
        "user_id": n.user_id,
        "type": n.type,
        "title": n.title,
        "body": n.body or n.message,
        "message": n.body or n.message,
        "data": n.data or {},
        "context": n.context,
        "status": n.status,
        "unread": n.status == "unread",
        "read_at": n.read_at.isoformat() if n.read_at else None,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


def _nid() -> str:
    return f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


@router.get("/")
async def list_notifications(request: Request, unread_only: bool = False,
                              status_filter: Optional[str] = None,
                              skip: int = 0, limit: int = 100,
                              db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    q = db.query(Notification).filter(
        Notification.org_id == user.org_id,
        Notification.user_id == user.id,
    )
    if unread_only:
        q = q.filter(Notification.status == "unread")
    elif status_filter:
        q = q.filter(Notification.status == status_filter)
    skip = max(0, skip)
    limit = max(1, min(limit, 200))
    rows = q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "items": [_serialize(n) for n in rows],
        "total": q.count(),
        "skip": skip,
        "limit": limit,
    }


@router.get("/{notification_id}")
async def get_notification(request: Request, notification_id: str,
                          db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.org_id == user.org_id,
        Notification.user_id == user.id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return _serialize(n)


@router.put("/{notification_id}/read")
async def mark_as_read(request: Request, notification_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.org_id == user.org_id,
        Notification.user_id == user.id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.status = "read"
    n.read_at = datetime.now(timezone.utc)
    n.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(n)
    return _serialize(n)


@router.put("/read-all")
async def mark_all_as_read(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    rows = db.query(Notification).filter(
        Notification.org_id == user.org_id,
        Notification.user_id == user.id,
        Notification.status == "unread",
    ).all()
    now = datetime.now(timezone.utc)
    for n in rows:
        n.status = "read"
        n.read_at = now
        n.updated_at = now
    db.commit()
    return {"updated": len(rows)}


@router.delete("/{notification_id}")
async def delete_notification(request: Request, notification_id: str,
                              db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.org_id == user.org_id,
        Notification.user_id == user.id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(n)
    db.commit()
    return {"message": "Notification deleted", "id": notification_id}


@router.post("/send")
async def send_notification(request: Request, payload: dict, db: Session = Depends(get_db)):
    """Send a notification to one or more users (admin only)."""
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    recipient_ids = payload.get("user_ids") or [payload.get("user_id")]
    if not recipient_ids or not recipient_ids[0]:
        raise HTTPException(status_code=400, detail="user_id(s) required")

    sent = []
    for uid in recipient_ids:
        n = Notification(
            id=_nid(),
            org_id=user.org_id,
            user_id=uid,
            type=payload.get("type") or "system",
            title=payload.get("title") or "Notification",
            body=payload.get("body") or payload.get("message") or "",
            context=payload.get("context"),
            data=payload.get("data", {}),
            status="unread",
            created_at=datetime.now(timezone.utc),
        )
        db.add(n)
        sent.append(n)
    db.commit()
    for n in sent:
        db.refresh(n)
    return {"sent": [_serialize(n) for n in sent]}