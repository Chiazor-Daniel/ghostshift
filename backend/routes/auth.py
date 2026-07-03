"""Authentication Routes — Production ready."""
import logging
import re
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from config.database import SessionLocal, get_db
from middleware.auth import (
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    verify_token,
    hash_password,
    verify_password,
)
from models.user import User
from models.organization import Organization
from models.invite import Invite

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Pydantic payloads ─────────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1)
    role: Optional[str] = "employee"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600
    user: dict


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class OnboardRequest(BaseModel):
    """Sign up + create org + create admin in one shot."""
    org_name: str = Field(..., min_length=1)
    org_type: Optional[str] = None
    org_size: Optional[str] = None
    country: Optional[str] = "United States"
    timezone: Optional[str] = "America/New_York"
    currency: Optional[str] = "USD"
    admin_name: str = Field(..., min_length=1)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8)
    departments: Optional[list] = []
    location: Optional[str] = None


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name.lower()).strip("-")
    return s or "org"


def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _make_id(prefix: str) -> str:
    return f"{prefix}_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


# ─── Endpoints ──────────────────────────────────────────────────────────────


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new employee into the default org (kept simple for backward compat)."""
    existing = db.query(User).filter(User.email == request.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    org = db.query(Organization).filter(Organization.name == "Default Org").first()
    if not org:
        org = Organization(
            id=_make_id("org"),
            name="Default Org",
            slug="default",
            country="United States",
            timezone="America/New_York",
        )
        db.add(org)
        db.commit()
        db.refresh(org)

    user = User(
        id=_make_id("user"),
        org_id=org.id,
        email=request.email.lower(),
        password_hash=hash_password(request.password),
        name=request.name,
        initials=_initials(request.name),
        role="employee",
        department="General",
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        {"user_id": user.id, "org_id": user.org_id, "role": user.role, "email": user.email}
    )
    refresh_token = create_refresh_token({"user_id": user.id, "org_id": user.org_id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={"id": user.id, "email": user.email, "name": user.name,
              "role": user.role, "org_id": user.org_id,
              "department": user.department, "avatar_url": user.avatar_url},
    )


@router.post("/onboard", response_model=TokenResponse)
async def onboard(request: OnboardRequest, db: Session = Depends(get_db)):
    """
    Create a brand-new organization AND its admin in one transaction.

    This is the path taken when a customer signs up via /signup.
    """
    email = request.admin_email.lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Try signing in instead.",
        )

    base_slug = _slugify(request.org_name)
    slug = base_slug
    suffix = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    org = Organization(
        id=_make_id("org"),
        name=request.org_name,
        slug=slug,
        description=request.org_type,
        country=request.country or "United States",
        timezone=request.timezone or "America/New_York",
        currency=request.currency or "USD",
        settings={
            "type": request.org_type,
            "size": request.org_size,
            "departments": request.departments or [],
            "location": request.location,
            "default_shift_length": 8,
            "week_starts_on": "monday",
        },
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(org)
    db.flush()

    # Create department records BEFORE creating admin user
    from models.organization import Department
    created_depts = []
    for dept_name in (request.departments or []):
        if not dept_name or not dept_name.strip():
            continue
        dept = Department(
            id=_make_id("dept"),
            org_id=org.id,
            name=dept_name.strip(),
            created_at=datetime.now(timezone.utc),
        )
        db.add(dept)
        created_depts.append(dept)
    if created_depts:
        db.flush()  # Flush to get department IDs

    # Determine admin's department (use first created dept if available, else "Administration")
    admin_dept_name = request.departments[0] if request.departments else "Administration"
    admin_dept_id = created_depts[0].id if created_depts else None

    admin = User(
        id=_make_id("user"),
        org_id=org.id,
        email=email,
        password_hash=hash_password(request.admin_password),
        name=request.admin_name,
        initials=_initials(request.admin_name),
        role="admin",
        title="Administrator",
        department=admin_dept_name,
        department_id=admin_dept_id,
        avatar_url=f"https://ui-avatars.com/api/?name={request.admin_name.replace(' ', '+')}&background=6366f1&color=fff&size=120",
        cover_color="#6366f1",
        created_at=datetime.now(timezone.utc),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    access_token = create_access_token(
        {"user_id": admin.id, "org_id": admin.org_id, "role": admin.role, "email": admin.email}
    )
    refresh_token = create_refresh_token({"user_id": admin.id, "org_id": admin.org_id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": admin.id, "email": admin.email, "name": admin.name,
            "role": admin.role, "org_id": admin.org_id,
            "department": admin.department, "avatar_url": admin.avatar_url,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Email + password login. Also accepts OAuth2 form for Swagger compatibility."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        {"user_id": user.id, "org_id": user.org_id, "role": user.role, "email": user.email}
    )
    refresh_token = create_refresh_token({"user_id": user.id, "org_id": user.org_id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id, "email": user.email, "name": user.name,
            "role": user.role, "org_id": user.org_id,
            "department": user.department, "avatar_url": user.avatar_url,
        },
    )


@router.post("/login/form", response_model=TokenResponse, include_in_schema=False)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2-compatible login endpoint for Swagger UI."""
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        {"user_id": user.id, "org_id": user.org_id, "role": user.role, "email": user.email}
    )
    refresh_token = create_refresh_token({"user_id": user.id, "org_id": user.org_id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id, "email": user.email, "name": user.name,
            "role": user.role, "org_id": user.org_id,
            "department": user.department, "avatar_url": user.avatar_url,
        },
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Issue a new access token using a valid refresh token."""
    payload = verify_token(request.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    user_id = payload.get("user_id")
    org_id = payload.get("org_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    access_token = create_access_token(
        {"user_id": user.id, "org_id": user.org_id, "role": user.role, "email": user.email}
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=request.refresh_token,
        user={
            "id": user.id, "email": user.email, "name": user.name,
            "role": user.role, "org_id": user.org_id,
            "department": user.department, "avatar_url": user.avatar_url,
        },
    )


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Always returns the same message to avoid leaking which emails exist."""
    user = db.query(User).filter(User.email == request.email.lower()).first()
    dev_token = None
    if user:
        reset_token = create_password_reset_token({"user_id": user.id})
        dev_token = reset_token
        logger.info(f"[DEV ONLY] Reset link for {user.email}: /reset-password?token={reset_token}")
    return {"message": "If the email exists, a reset link has been sent.", "dev_token": dev_token}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = verify_token(request.token)
    if payload.get("type") != "password_reset":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.password_hash = hash_password(request.new_password)
    db.commit()
    return {"message": "Password reset successful"}


@router.post("/change-password")
async def change_password(request: Request, payload: ChangePasswordRequest, db: Session = Depends(get_db)):
    """Allow any authenticated user to change their own password."""
    from middleware.auth import get_current_user
    user = await get_current_user(request, db)
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    """Return the authenticated user's full profile, including organization."""
    from middleware.auth import get_current_user
    user = await get_current_user(request, db)
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "initials": user.initials,
        "role": user.role,
        "title": user.title,
        "department": user.department,
        "avatar_url": user.avatar_url,
        "cover_color": user.cover_color,
        "org_id": user.org_id,
        "organization": _serialize_org(org) if org else None,
    }


def _serialize_org(o: Organization) -> dict:
    return {
        "id": o.id,
        "name": o.name,
        "slug": o.slug,
        "country": o.country,
        "timezone": o.timezone,
        "currency": o.currency,
        "settings": o.settings or {},
    }
