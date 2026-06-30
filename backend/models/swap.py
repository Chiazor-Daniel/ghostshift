"""
Swap Request Model - Shift swapping
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base
import enum


class SwapStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"


class SwapRequest(Base):
    __tablename__ = "swap_requests"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_swap_org"), nullable=False)
    requester_id = Column(String(50), ForeignKey("users.id", name="fk_swap_requester"), nullable=False)
    responder_id = Column(String(50), ForeignKey("users.id", name="fk_swap_responder"))
    requester_shift_id = Column(String(50), ForeignKey("shifts.id", name="fk_swap_requester_shift"), nullable=False)
    responder_shift_id = Column(String(50), ForeignKey("shifts.id", name="fk_swap_responder_shift"))
    target_employee_id = Column(String(50), ForeignKey("users.id", name="fk_swap_target_emp"))
    reason = Column(String(500))
    status = Column(String(20), default="pending", nullable=False, index=True)
    ai_match_score = Column(Integer, default=80)
    message = Column(String(500))
    expires_at = Column(DateTime)
    approved_at = Column(DateTime)
    rejected_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization")
    requester = relationship("User", back_populates="swap_requests", foreign_keys=[requester_id])
    responder = relationship("User", back_populates="swap_responses", foreign_keys=[responder_id])
    requester_shift = relationship("Shift", back_populates="swap_requests_as_requester", foreign_keys=[requester_shift_id])
    responder_shift = relationship("Shift", back_populates="swap_requests_as_responder", foreign_keys=[responder_shift_id])
