"""
Swap Request Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from config.database import get_db
from middleware.auth import get_current_user
from models.swap import SwapRequest, SwapStatus
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_swap_requests(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    status_filter: str = None
):
    """List swap requests for current user"""
    query = db.query(SwapRequest).filter(
        SwapRequest.org_id == current_user.org_id
    )
    
    if status_filter:
        query = query.filter(SwapRequest.status == status_filter)
    
    swap_requests = query.all()
    return swap_requests


@router.post("/")
async def create_swap_request(
    swap_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new swap request"""
    swap_request = SwapRequest(
        id=f"swap_{datetime.utcnow().timestamp()}",
        org_id=current_user.org_id,
        requester_id=current_user.id,
        responder_id=swap_data.get("responder_id"),
        requester_shift_id=swap_data.get("requester_shift_id"),
        responder_shift_id=swap_data.get("responder_shift_id"),
        status=SwapStatus.PENDING,
        message=swap_data.get("message"),
        expires_at=datetime.utcnow() + timedelta(days=7),
        created_at=datetime.utcnow()
    )
    
    db.add(swap_request)
    db.commit()
    db.refresh(swap_request)
    
    return swap_request


@router.get("/{swap_id}")
async def get_swap_request(
    swap_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get swap request details"""
    swap_request = db.query(SwapRequest).filter(
        SwapRequest.id == swap_id,
        SwapRequest.org_id == current_user.org_id
    ).first()
    
    if not swap_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    return swap_request


@router.put("/{swap_id}/approve")
async def approve_swap(
    swap_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Approve swap request"""
    swap_request = db.query(SwapRequest).filter(
        SwapRequest.id == swap_id,
        SwapRequest.org_id == current_user.org_id
    ).first()
    
    if not swap_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    if swap_request.status != SwapStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Swap request is not pending"
        )
    
    swap_request.status = SwapStatus.APPROVED
    swap_request.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(swap_request)
    
    return swap_request


@router.put("/{swap_id}/reject")
async def reject_swap(
    swap_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Reject swap request"""
    swap_request = db.query(SwapRequest).filter(
        SwapRequest.id == swap_id,
        SwapRequest.org_id == current_user.org_id
    ).first()
    
    if not swap_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    if swap_request.status != SwapStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Swap request is not pending"
        )
    
    swap_request.status = SwapStatus.REJECTED
    swap_request.rejected_at = datetime.utcnow()
    db.commit()
    db.refresh(swap_request)
    
    return swap_request


@router.delete("/{swap_id}")
async def withdraw_swap(
    swap_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Withdraw swap request"""
    swap_request = db.query(SwapRequest).filter(
        SwapRequest.id == swap_id,
        SwapRequest.org_id == current_user.org_id,
        SwapRequest.requester_id == current_user.id
    ).first()
    
    if not swap_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    swap_request.status = SwapStatus.WITHDRAWN
    db.commit()
    
    return {"message": "Swap request withdrawn"}
