"""Invite routes — link-based invitation flow.

An invite creates a pending token. The recipient opens the link, sets their own
password, and only then becomes an active user in the org. No email integration
is required; admins copy the link and share it through their own channel.
"""
import logging
import secrets
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Request, status, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from config.database import get_db
from middleware.auth import get_current_user, hash_password, verify_password
from models.invite import Invite
from models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


class InviteCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1)
    department: Optional[str] = None
    role: Optional[str] = "employee"


def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _iid() -> str:
    return f"inv_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


def _uid() -> str:
    return f"user_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


def _serialize_invite(i: Invite) -> dict:
    return {
        "id": i.id,
        "org_id": i.org_id,
        "invited_by_id": i.invited_by_id,
        "email": i.email,
        "name": i.name,
        "department": i.department,
        "role": i.role,
        "status": i.status,
        "token": i.token,
        "expires_at": i.expires_at.isoformat() if i.expires_at else None,
        "accepted_at": i.accepted_at.isoformat() if i.accepted_at else None,
        "created_at": i.created_at.isoformat() if i.created_at else None,
    }


@router.get("/")
async def list_invites(request: Request, status_filter: Optional[str] = None,
                      db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    q = db.query(Invite).filter(Invite.org_id == user.org_id)
    if status_filter:
        q = q.filter(Invite.status == status_filter)
    return [_serialize_invite(i) for i in q.order_by(Invite.created_at.desc()).all()]


@router.post("/")
async def create_invite(request: Request, payload: dict, db: Session = Depends(get_db)):
    """
    Create a pending invite for a new employee.

    - No user account is created until the recipient opens the link and sets a password.
    - Returns a full invite URL the admin can copy and share manually.
    """
    user = await get_current_user(request, db)

    email = (payload.get("email") or "").lower().strip()
    name = (payload.get("name") or "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    # Block duplicates — case-insensitive email match within the org
    existing_user = db.query(User).filter(
        User.org_id == user.org_id,
        func.lower(User.email) == email.lower()
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail=f"{existing_user.name or email} is already a member of this organization.",
        )

    # Block duplicate names (case-insensitive) within the org to prevent confusion
    existing_name = db.query(User).filter(
        User.org_id == user.org_id,
        func.lower(User.name) == name.lower()
    ).first()
    if existing_name:
        raise HTTPException(
            status_code=409,
            detail=f"A member named {existing_name.name} already exists in this organization. Please use a different name.",
        )

    # Block duplicate pending invites for the same email in this org
    existing_pending = db.query(Invite).filter(
        Invite.org_id == user.org_id,
        func.lower(Invite.email) == email.lower(),
        Invite.status == "pending",
    ).first()
    if existing_pending:
        raise HTTPException(
            status_code=409,
            detail=f"A pending invite for {email} already exists.",
        )

    role = (payload.get("role") or "employee").lower()
    department = payload.get("department") or "Unassigned"

    token = secrets.token_urlsafe(32)
    invite = Invite(
        id=_iid(),
        org_id=user.org_id,
        invited_by_id=user.id,
        email=email,
        name=name,
        department=department,
        role=role,
        status="pending",
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        created_at=datetime.now(timezone.utc),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    invite_url = f"/accept-invite/{token}"
    return {
        "invite": _serialize_invite(invite),
        "invite_url": invite_url,
        "invite_token": token,
    }

@router.get("/preview/{token}")
async def preview_invite(token: str, db: Session = Depends(get_db)):
    """
    Public endpoint — the token IS the auth.

    Returns the org name, role, department, and email for the pending invite.
    If the invite has already been accepted, the user should sign in instead.
    """
    invite = db.query(Invite).filter(Invite.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite link is invalid or has been revoked.")
    if invite.status == "revoked":
        raise HTTPException(status_code=410, detail="This invite has been revoked by your admin.")
    if invite.status == "accepted":
        raise HTTPException(status_code=410, detail="This invite has already been used. Please sign in instead.")
    if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This invite link has expired.")

    from models.organization import Organization
    org = db.query(Organization).filter(Organization.id == invite.org_id).first()

    return {
        "invite": _serialize_invite(invite),
        "organization": {"id": org.id, "name": org.name} if org else None,
    }


@router.get("/{invite_id}")
async def get_invite(request: Request, invite_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    invite = db.query(Invite).filter(
        Invite.id == invite_id, Invite.org_id == user.org_id
    ).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    return _serialize_invite(invite)


@router.put("/{invite_id}/revoke")
async def revoke_invite(request: Request, invite_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    invite = db.query(Invite).filter(
        Invite.id == invite_id, Invite.org_id == user.org_id
    ).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    invite.status = "revoked"
    invite.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(invite)
    return _serialize_invite(invite)





class AcceptInvitePayload(BaseModel):
    token: str
    password: str = Field(..., min_length=8)


@router.post("/accept")
async def accept_invite(payload: AcceptInvitePayload, db: Session = Depends(get_db)):
    """
    Public endpoint — create the user account and activate the invite.

    The recipient opens the invite link, sets their own password, and only then
    becomes an active member of the organization.
    """
    token = (payload.token or "").strip()
    password = payload.password
    if not token:
        raise HTTPException(status_code=400, detail="Missing invite token")
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    invite = db.query(Invite).filter(Invite.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite")
    if invite.status == "revoked":
        raise HTTPException(status_code=410, detail="This invite has been revoked by your admin.")
    if invite.status == "accepted":
        raise HTTPException(status_code=410, detail="This invite has already been used. Please sign in instead.")
    if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This invite link has expired.")

    # Block duplicate user just in case
    existing_user = db.query(User).filter(
        User.org_id == invite.org_id,
        func.lower(User.email) == invite.email.lower(),
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail=f"{invite.email} is already a member. Please sign in instead.",
        )

    new_user = User(
        id=_uid(),
        org_id=invite.org_id,
        email=invite.email,
        password_hash=hash_password(password),
        name=invite.name,
        initials=_initials(invite.name),
        role=invite.role,
        title="Administrator" if invite.role == "admin" else "Staff",
        department=invite.department or "Unassigned",
        avatar_url=f"https://ui-avatars.com/api/?name={invite.name.replace(' ', '+')}&background=6366f1&color=fff&size=120",
        cover_color="#6366f1",
        status="active",
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_user)

    invite.status = "accepted"
    invite.accepted_at = datetime.now(timezone.utc)
    invite.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(new_user)
    db.refresh(invite)

    return {
        "message": "Invite accepted. You can now sign in.",
        "invite": _serialize_invite(invite),
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
            "department": new_user.department,
        },
    }
