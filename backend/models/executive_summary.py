"""
Executive Summary database model
"""
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from database import Base


class ExecutiveSummary(Base):
    __tablename__ = "executive_summaries"

    summary_id = Column(String(36), primary_key=True)
    scenario_id = Column(String(36), ForeignKey("failure_scenarios.scenario_id"), nullable=False, index=True)
    revenue_risk = Column(String(500), nullable=False)  # High/Medium/Low with $ impact
    market_reason = Column(String(1000), nullable=False)  # Brief explanation
    urgency_level = Column(String(50), nullable=False)  # Critical/High/Medium/Low
    recommended_actions = Column(JSON, nullable=True)
    trade_offs = Column(JSON, nullable=True)
    generated_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "summary_id": self.summary_id,
            "scenario_id": self.scenario_id,
            "revenue_risk": self.revenue_risk,
            "market_reason": self.market_reason,
            "urgency_level": self.urgency_level,
            "recommended_actions": self.recommended_actions,
            "trade_offs": self.trade_offs,
            "generated_timestamp": self.generated_timestamp.isoformat() if self.generated_timestamp else None,
        }
