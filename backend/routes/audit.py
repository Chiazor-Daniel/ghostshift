"""
Audit Log Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from config.database import get_db
from middleware.auth import get_current_user
from models.audit import AuditLog, AuditAction
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_audit_logs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    action_filter: str = None,
    start_date: str = None,
    end_date: str = None
):
    """List audit logs for organization"""
    query = db.query(AuditLog).filter(
        AuditLog.org_id == current_user.org_id
    )
    
    if action_filter:
        query = query.filter(AuditLog.action == action_filter)
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    audit_logs = query.order_by(AuditLog.created_at.desc()).all()
    return audit_logs


@router.get("/{audit_id}")
async def get_audit_log(
    audit_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get audit log details"""
    audit_log = db.query(AuditLog).filter(
        AuditLog.id == audit_id,
        AuditLog.org_id == current_user.org_id
    ).first()
    
    if not audit_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )
    
    return audit_log


@router.post("/log")
async def create_audit_log(
    audit_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create audit log entry"""
    audit_log = AuditLog(
        id=f"audit_{datetime.utcnow().timestamp()}",
        org_id=current_user.org_id,
        user_id=current_user.id,
        action=audit_data.get("action"),
        entity_type=audit_data.get("entity_type"),
        entity_id=audit_data.get("entity_id"),
        old_values=audit_data.get("old_values", {}),
        new_values=audit_data.get("new_values", {}),
        ip_address=audit_data.get("ip_address"),
        user_agent=audit_data.get("user_agent"),
        created_at=datetime.utcnow()
    )
    
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    return audit_log
