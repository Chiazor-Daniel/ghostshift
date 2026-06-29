"""
Authentication Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from config.database import get_db
from middleware.auth import create_access_token, create_refresh_token, verify_token
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshTokenRequest
from models.user import User
from utils.email import email_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user (password hashing would be done here)
    user = User(
        id=f"user_{datetime.utcnow().timestamp()}",
        email=request.email,
        password_hash=request.password,  # In production, hash this
        name=request.name,
        org_id=request.org_id or "default_org",
        role="employee",
        created_at=datetime.utcnow()
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create tokens
    access_token = create_access_token(
        data={"user_id": user.id, "org_id": user.org_id, "role": user.role, "email": user.email}
    )
    refresh_token = create_refresh_token(
        data={"user_id": user.id, "org_id": user.org_id}
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login user"""
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or user.password_hash != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    access_token = create_access_token(
        data={"user_id": user.id, "org_id": user.org_id, "role": user.role, "email": user.email}
    )
    refresh_token = create_refresh_token(
        data={"user_id": user.id, "org_id": user.org_id}
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token"""
    try:
        payload = verify_token(request.refresh_token)
        user_id = payload.get("user_id")
        org_id = payload.get("org_id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Create new tokens
        access_token = create_access_token(
            data={"user_id": user_id, "org_id": org_id, "role": payload.get("role", "employee"), "email": payload.get("email")}
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=request.refresh_token,  # Refresh token stays the same
            token_type="bearer",
            expires_in=3600
        )
    except HTTPException:
        raise


@router.post("/forgot-password")
async def forgot_password(email: str, db: Session = Depends(get_db)):
    """Forgot password - send reset email"""
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Don't reveal if user exists
        return {"message": "If email exists, reset link sent"}
    
    # Generate reset token
    reset_token = create_access_token(
        data={"user_id": user.id, "action": "reset_password"},
        expires_delta=timedelta(hours=1)
    )
    
    # Send reset email
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    await email_service.send_email(
        to=email,
        subject="Password Reset",
        body=f"Click the link to reset your password: {reset_url}",
        html=f"<p>Click the link to reset your password: <a href='{reset_url}'>Reset Password</a></p>"
    )
    
    return {"message": "If email exists, reset link sent"}


@router.post("/reset-password")
async def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    """Reset password"""
    try:
        payload = verify_token(token)
        
        if payload.get("action") != "reset_password":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token"
            )
        
        user_id = payload.get("user_id")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password (hash in production)
        user.password_hash = new_password
        db.commit()
        
        return {"message": "Password reset successful"}
    
    except HTTPException:
        raise


@router.get("/me")
async def get_current_user():
    """Get current user info"""
    # This would use the get_current_user dependency
    return {"message": "Get current user info"}
