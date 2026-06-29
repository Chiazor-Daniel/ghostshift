"""
Certification Alert Model - Track cert expiry
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
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
    expiry_date = Column(DateTime, nullable=False)
    days_until_expiry = Column(Integer, nullable=False)
    status = Column(Enum(CertAlertStatus), default=CertAlertStatus.ACTIVE)
    priority = Column(Integer, default=1)
    notes = Column(String(500))
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization")
    employee = relationship("User", back_populates="cert_alerts")
