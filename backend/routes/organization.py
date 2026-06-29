"""
Organization Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from config.database import get_db
from middleware.auth import get_current_user
from models.organization import Organization, Department, LeavePolicy
from schemas.auth import TokenResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def get_organization(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get organization details"""
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    return org


@router.put("/")
async def update_organization(
    org_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update organization details"""
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Update organization fields
    for key, value in org_data.items():
        if hasattr(org, key):
            setattr(org, key, value)
    
    org.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(org)
    
    return org


@router.get("/departments")
async def list_departments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all departments in organization"""
    departments = db.query(Department).filter(
        Department.org_id == current_user.org_id
    ).all()
    return departments


@router.post("/departments")
async def create_department(
    department_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new department"""
    department = Department(
        id=f"dept_{datetime.utcnow().timestamp()}",
        org_id=current_user.org_id,
        name=department_data.get("name"),
        description=department_data.get("description"),
        manager_id=department_data.get("manager_id"),
        created_at=datetime.utcnow()
    )
    
    db.add(department)
    db.commit()
    db.refresh(department)
    
    return department


@router.get("/leave-policies")
async def list_leave_policies(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all leave policies"""
    policies = db.query(LeavePolicy).filter(
        LeavePolicy.org_id == current_user.org_id
    ).all()
    return policies
