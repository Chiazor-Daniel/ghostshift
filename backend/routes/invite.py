"""Invite routes — production ready with auto-accept (per product spec)."""
import logging
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, status, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from config.database import get_db
from middleware.auth import get_current_user, hash_password
from models.invite import Invite
from models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


class InviteCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = "employee"
    password: Optional[str] = None  # auto-generated default password for instant access


def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _iid() -> str:
    return f"inv_{int(datetime.utcnow().timestamp() * 1000)}_{secrets.token_hex(4)}"


def _uid() -> str:
    return f"user_{int(datetime.utcnow().timestamp() * 1000)}_{secrets.token_hex(4)}"


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
    Create an invite and AUTO-ACCEPT it (per product spec).

    - Invited user record is provisioned immediately with role + temp password
    - Token is returned for optional email/UI use
    - Frontend can also call this and show the user is already in the team
    """
    user = await get_current_user(request, db)

    email = (payload.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # Block duplicates
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user and existing_user.org_id == user.org_id:
        # If the user already exists in this org, return them as the "invited" entry
        return {
            "invite": {
                "id": f"existing-{existing_user.id}",
                "email": existing_user.email,
                "name": existing_user.name,
                "department": existing_user.department,
                "role": existing_user.role,
                "status": "already_member",
                "token": None,
                "expires_at": None,
                "accepted_at": None,
            },
            "invite_url": None,
            "created_user": {
                "id": existing_user.id, "email": existing_user.email,
                "name": existing_user.name, "role": existing_user.role,
            },
            "auto_accepted": True,
        }

    # Default password is auto-generated; admin can override
    plain_password = payload.get("password") or secrets.token_urlsafe(8)
    role = (payload.get("role") or "employee").lower()
    name = (payload.get("name") or email.split("@")[0]).strip()

    new_user = User(
        id=_uid(),
        org_id=user.org_id,
        email=email,
        password_hash=hash_password(plain_password),
        name=name,
        initials=_initials(name),
        role=role,
        title="Administrator" if role == "admin" else "Staff",
        department=payload.get("department") or "Unassigned",
        avatar_url=f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=6366f1&color=fff&size=120",
        cover_color="#6366f1",
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.flush()

    token = secrets.token_urlsafe(32)
    invite = Invite(
        id=_iid(),
        org_id=user.org_id,
        invited_by_id=user.id,
        email=email,
        name=name,
        department=payload.get("department"),
        role=role,
        status="accepted",  # auto-accepted per product spec
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        accepted_at=datetime.utcnow(),
        password_hash=hash_password(plain_password),
        created_at=datetime.utcnow(),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    db.refresh(new_user)

    invite_url = f"/accept-invite/{token}"
    return {
        "invite": _serialize_invite(invite),
        "invite_url": invite_url,
        "invite_token": token,
        "created_user": {
            "id": new_user.id, "email": new_user.email,
            "name": new_user.name, "role": new_user.role,
            "department": new_user.department,
            "temp_password": plain_password if not payload.get("password") else None,
        },
        "auto_accepted": True,
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
    invite.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(invite)
    return _serialize_invite(invite)


@router.post("/accept")
async def accept_invite(request: Request, token: str, db: Session = Depends(get_db)):
    """Manual accept path — kept for completeness; our default flow auto-accepts."""
    user = await get_current_user(request, db)
    invite = db.query(Invite).filter(
        Invite.token == token, Invite.org_id == user.org_id
    ).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite")
    invite.status = "accepted"
    invite.accepted_at = datetime.utcnow()
    invite.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Invite accepted", "invite": _serialize_invite(invite)}
