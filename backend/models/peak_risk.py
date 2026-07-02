"""
Peak Hour Risk Model - Burnout prediction
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base


class PeakHourRisk(Base):
    __tablename__ = "peak_hour_risk"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_peak_risk_org"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)  # Date of prediction
    hour = Column(Integer, nullable=False)  # Hour (0-23)
    risk_score = Column(Integer, nullable=False)  # 0-100
    predicted_staff_shortage = Column(Integer, default=0)
    predicted_burnout_cases = Column(Integer, default=0)
    factors = Column(JSON, default=dict)
    recommendations = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization")
