"""
Leave Request Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from config.database import get_db
from middleware.auth import get_current_user
from models.leave import LeaveRequest, LeaveStatus, LeaveType
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_leave_requests(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    status_filter: str = None
):
    """List leave requests for current user"""
    query = db.query(LeaveRequest).filter(
        LeaveRequest.org_id == current_user.org_id,
        LeaveRequest.employee_id == current_user.id
    )
    
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    
    leave_requests = query.all()
    return leave_requests


@router.post("/")
async def create_leave_request(
    leave_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new leave request"""
    start_date = leave_data.get("start_date")
    end_date = leave_data.get("end_date")
    
    # Calculate duration
    start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    duration_days = (end - start).days + 1
    
    leave_request = LeaveRequest(
        id=f"leave_{datetime.utcnow().timestamp()}",
        org_id=current_user.org_id,
        employee_id=current_user.id,
        type=leave_data.get("type"),
        start_date=start_date,
        end_date=end_date,
        duration_days=duration_days,
        status=LeaveStatus.PENDING,
        reason=leave_data.get("reason"),
        created_at=datetime.utcnow()
    )
    
    db.add(leave_request)
    db.commit()
    db.refresh(leave_request)
    
    return leave_request


@router.get("/{leave_id}")
async def get_leave_request(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get leave request details"""
    leave_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.org_id == current_user.org_id,
        LeaveRequest.employee_id == current_user.id
    ).first()
    
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    return leave_request


@router.put("/{leave_id}/approve")
async def approve_leave(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Approve leave request (manager only)"""
    leave_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.org_id == current_user.org_id
    ).first()
    
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    if leave_request.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave request is not pending"
        )
    
    leave_request.status = LeaveStatus.APPROVED
    leave_request.approved_at = datetime.utcnow()
    leave_request.approved_by = current_user.id
    db.commit()
    db.refresh(leave_request)
    
    return leave_request


@router.put("/{leave_id}/reject")
async def reject_leave(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Reject leave request (manager only)"""
    leave_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.org_id == current_user.org_id
    ).first()
    
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    if leave_request.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave request is not pending"
        )
    
    leave_request.status = LeaveStatus.REJECTED
    leave_request.rejected_at = datetime.utcnow()
    db.commit()
    db.refresh(leave_request)
    
    return leave_request


@router.delete("/{leave_id}")
async def cancel_leave(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cancel leave request"""
    leave_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.org_id == current_user.org_id,
        LeaveRequest.employee_id == current_user.id
    ).first()
    
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    if leave_request.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending leave requests"
        )
    
    leave_request.status = LeaveStatus.CANCELLED
    db.commit()
    
    return {"message": "Leave request cancelled"}
