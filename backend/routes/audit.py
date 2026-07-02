"""Audit log routes — production ready."""
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user
from models.audit import AuditLog

logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize(a: AuditLog) -> dict:
    return {
        "id": a.id,
        "org_id": a.org_id,
        "user_id": a.user_id,
        "action": a.action,
        "entity_type": a.entity_type,
        "entity_id": a.entity_id,
        "old_values": a.old_values or {},
        "new_values": a.new_values or {},
        "ip_address": a.ip_address,
        "user_agent": a.user_agent,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


def _aid() -> str:
    return f"a_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


@router.get("/")
async def list_audit(request: Request, action_filter: Optional[str] = None,
                     db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    q = db.query(AuditLog).filter(AuditLog.org_id == user.org_id)
    if action_filter:
        q = q.filter(AuditLog.action == action_filter)
    rows = q.order_by(AuditLog.created_at.desc()).limit(200).all()
    return [_serialize(a) for a in rows]


@router.post("/log")
async def create_audit(request: Request, payload: dict, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    entry = AuditLog(
        id=_aid(),
        org_id=user.org_id,
        user_id=user.id,
        action=payload.get("action") or "info",
        entity_type=payload.get("entity_type"),
        entity_id=payload.get("entity_id"),
        old_values=payload.get("old_values") or {},
        new_values=payload.get("new_values") or {},
        ip_address=payload.get("ip_address"),
        user_agent=payload.get("user_agent"),
        created_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _serialize(entry)