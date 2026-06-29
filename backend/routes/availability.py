"""
Availability Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from config.database import get_db
from middleware.auth import get_current_user
from models.availability import Availability, AvailabilityStatus
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def get_availability(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get availability for current user"""
    availability = db.query(Availability).filter(
        Availability.org_id == current_user.org_id,
        Availability.employee_id == current_user.id
    ).all()
    return availability


@router.post("/")
async def update_availability(
    availability_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update availability for current user"""
    # Check if availability exists
    existing = db.query(Availability).filter(
        Availability.org_id == current_user.org_id,
        Availability.employee_id == current_user.id,
        Availability.day_of_week == availability_data.get("day_of_week")
    ).first()
    
    if existing:
        # Update existing
        for key, value in availability_data.items():
            if hasattr(existing, key) and key not in ["id", "org_id", "employee_id", "created_at"]:
                setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new
        availability = Availability(
            id=f"avail_{datetime.utcnow().timestamp()}",
            org_id=current_user.org_id,
            employee_id=current_user.id,
            day_of_week=availability_data.get("day_of_week"),
            start_time=availability_data.get("start_time"),
            end_time=availability_data.get("end_time"),
            status=availability_data.get("status", AvailabilityStatus.AVAILABLE),
            is_recurring=availability_data.get("is_recurring", True),
            created_at=datetime.utcnow()
        )
        db.add(availability)
        db.commit()
        db.refresh(availability)
        return availability


@router.get("/coverage")
async def get_coverage_availability(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    department_id: str = None,
    date: str = None
):
    """Get availability for coverage planning"""
    query = db.query(Availability).filter(
        Availability.org_id == current_user.org_id
    )
    
    if department_id:
        # Join with users to filter by department
        pass
    
    availability = query.all()
    return availability
