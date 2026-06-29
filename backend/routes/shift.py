"""
Shift Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from config.database import get_db
from middleware.auth import get_current_user
from models.shift import Shift
from models.attendance import Attendance
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_shifts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    start_date: str = None,
    end_date: str = None,
    department_id: str = None
):
    """List shifts with optional filters"""
    query = db.query(Shift).filter(Shift.org_id == current_user.org_id)
    
    if start_date:
        query = query.filter(Shift.start_time >= start_date)
    if end_date:
        query = query.filter(Shift.end_time <= end_date)
    if department_id:
        query = query.filter(Shift.department_id == department_id)
    
    shifts = query.all()
    return shifts


@router.post("/")
async def create_shift(
    shift_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new shift"""
    shift = Shift(
        id=f"shift_{datetime.utcnow().timestamp()}",
        org_id=current_user.org_id,
        department_id=shift_data.get("department_id"),
        employee_id=shift_data.get("employee_id"),
        manager_id=shift_data.get("manager_id") or current_user.id,
        title=shift_data.get("title"),
        description=shift_data.get("description"),
        start_time=shift_data.get("start_time"),
        end_time=shift_data.get("end_time"),
        duration_hours=shift_data.get("duration_hours"),
        status=shift_data.get("status", "scheduled"),
        type=shift_data.get("type", "regular"),
        location=shift_data.get("location"),
        created_at=datetime.utcnow()
    )
    
    db.add(shift)
    db.commit()
    db.refresh(shift)
    
    return shift


@router.get("/{shift_id}")
async def get_shift(
    shift_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get shift details"""
    shift = db.query(Shift).filter(
        Shift.id == shift_id,
        Shift.org_id == current_user.org_id
    ).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    return shift


@router.put("/{shift_id}")
async def update_shift(
    shift_id: str,
    shift_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update shift details"""
    shift = db.query(Shift).filter(
        Shift.id == shift_id,
        Shift.org_id == current_user.org_id
    ).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    # Update shift fields
    for key, value in shift_data.items():
        if hasattr(shift, key) and key not in ["id", "org_id", "created_at"]:
            setattr(shift, key, value)
    
    shift.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(shift)
    
    return shift


@router.delete("/{shift_id}")
async def delete_shift(
    shift_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete shift"""
    shift = db.query(Shift).filter(
        Shift.id == shift_id,
        Shift.org_id == current_user.org_id
    ).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    db.delete(shift)
    db.commit()
    
    return {"message": "Shift deleted successfully"}


@router.post("/{shift_id}/attendance")
async def record_attendance(
    shift_id: str,
    attendance_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Record employee attendance for shift"""
    shift = db.query(Shift).filter(
        Shift.id == shift_id,
        Shift.org_id == current_user.org_id
    ).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    attendance = Attendance(
        id=f"att_{datetime.utcnow().timestamp()}",
        shift_id=shift_id,
        employee_id=attendance_data.get("employee_id"),
        clock_in=attendance_data.get("clock_in"),
        clock_out=attendance_data.get("clock_out"),
        actual_hours=attendance_data.get("actual_hours"),
        status=attendance_data.get("status", "scheduled"),
        created_at=datetime.utcnow()
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return attendance
