"""
Swap Request Model - Shift swapping
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
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
    __table_args__ = (
        Index('idx_swap_org_status_kind', 'org_id', 'status', 'kind'),
        Index('idx_swap_requester_shift', 'requester_id', 'requester_shift_id'),
    )

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_swap_org"), nullable=False)
    requester_id = Column(String(50), ForeignKey("users.id", name="fk_swap_requester"), nullable=False)
    responder_id = Column(String(50), ForeignKey("users.id", name="fk_swap_responder"))
    requester_shift_id = Column(String(50), ForeignKey("shifts.id", name="fk_swap_requester_shift"), nullable=True)
    responder_shift_id = Column(String(50), ForeignKey("shifts.id", name="fk_swap_responder_shift"))
    target_employee_id = Column(String(50), ForeignKey("users.id", name="fk_swap_target_emp"))
    # 'swap' = requester gives up requester_shift for responder_shift
    # 'pickup' = requester claims an open shift from the marketplace
    kind = Column(String(20), default="swap", nullable=False)
    reason = Column(String(500))
    status = Column(String(20), default="pending", nullable=False, index=True)
    ai_match_score = Column(Integer, default=80)
    message = Column(String(500))
    expires_at = Column(DateTime(timezone=True))
    approved_at = Column(DateTime(timezone=True))
    rejected_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization")
    requester = relationship("User", back_populates="swap_requests", foreign_keys=[requester_id])
    responder = relationship("User", back_populates="swap_responses", foreign_keys=[responder_id])
    requester_shift = relationship("Shift", back_populates="swap_requests_as_requester", foreign_keys=[requester_shift_id])
    responder_shift = relationship("Shift", back_populates="swap_requests_as_responder", foreign_keys=[responder_shift_id])
