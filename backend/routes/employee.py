"""
Employee Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from config.database import get_db
from middleware.auth import get_current_user
from models.user import User
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_employees(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all employees in organization"""
    employees = db.query(User).filter(
        User.org_id == current_user.org_id,
        User.role == "employee"
    ).all()
    return employees


@router.get("/{employee_id}")
async def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get employee details"""
    employee = db.query(User).filter(
        User.id == employee_id,
        User.org_id == current_user.org_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    return employee


@router.put("/{employee_id}")
async def update_employee(
    employee_id: str,
    employee_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update employee details"""
    employee = db.query(User).filter(
        User.id == employee_id,
        User.org_id == current_user.org_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Update employee fields
    for key, value in employee_data.items():
        if hasattr(employee, key) and key not in ["id", "org_id", "created_at"]:
            setattr(employee, key, value)
    
    employee.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(employee)
    
    return employee


@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete employee"""
    employee = db.query(User).filter(
        User.id == employee_id,
        User.org_id == current_user.org_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    db.delete(employee)
    db.commit()
    
    return {"message": "Employee deleted successfully"}
