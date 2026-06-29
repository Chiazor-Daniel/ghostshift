"""
Invite Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from config.database import get_db
from middleware.auth import get_current_user
from models.invite import Invite, InviteStatus
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_invites(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    status_filter: str = None
):
    """List invites for organization"""
    query = db.query(Invite).filter(
        Invite.org_id == current_user.org_id
    )
    
    if status_filter:
        query = query.filter(Invite.status == status_filter)
    
    invites = query.all()
    return invites


@router.post("/")
async def create_invite(
    invite_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new invite"""
    import secrets
    token = secrets.token_urlsafe(32)
    
    invite = Invite(
        id=f"invite_{datetime.utcnow().timestamp()}",
        org_id=current_user.org_id,
        invited_by_id=current_user.id,
        email=invite_data.get("email"),
        role=invite_data.get("role"),
        status=InviteStatus.PENDING,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        created_at=datetime.utcnow()
    )
    
    db.add(invite)
    db.commit()
    db.refresh(invite)
    
    # Generate invite URL
    invite_url = f"http://localhost:5173/invite?token={token}"
    
    # Send invite email (would use email service in production)
    return {
        "invite": invite,
        "invite_url": invite_url
    }


@router.get("/{invite_id}")
async def get_invite(
    invite_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get invite details"""
    invite = db.query(Invite).filter(
        Invite.id == invite_id,
        Invite.org_id == current_user.org_id
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )
    
    return invite


@router.put("/{invite_id}/revoke")
async def revoke_invite(
    invite_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Revoke invite"""
    invite = db.query(Invite).filter(
        Invite.id == invite_id,
        Invite.org_id == current_user.org_id
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )
    
    invite.status = InviteStatus.REVOKED
    db.commit()
    db.refresh(invite)
    
    return invite


@router.post("/accept")
async def accept_invite(
    token: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Accept invite"""
    invite = db.query(Invite).filter(
        Invite.token == token,
        Invite.status == InviteStatus.PENDING
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired invite"
        )
    
    # Update invite status
    invite.status = InviteStatus.ACCEPTED
    invite.accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(invite)
    
    return {"message": "Invite accepted successfully"}
