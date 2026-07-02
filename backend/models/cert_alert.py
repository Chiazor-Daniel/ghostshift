"""
Certification Alert Model - Track cert expiry
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base
import enum


class CertAlertStatus(str, enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    IGNORED = "ignored"


class CertificationAlert(Base):
    __tablename__ = "certification_alerts"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_cert_alert_org"), nullable=False)
    employee_id = Column(String(50), ForeignKey("users.id", name="fk_cert_alert_employee"), nullable=False)
    cert_name = Column(String(255), nullable=False)
    expiry_date = Column(DateTime(timezone=True), nullable=False)
    days_until_expiry = Column(Integer, nullable=False)
    status = Column(Enum(CertAlertStatus), default=CertAlertStatus.ACTIVE)
    priority = Column(Integer, default=1)
    notes = Column(String(500))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization")
    employee = relationship("User", back_populates="cert_alerts")
