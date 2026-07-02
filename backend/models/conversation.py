"""
Conversation memory model for the AI assistant.

One row per turn (user message, assistant message, or tool call/result).
Keyed by (user_id, session_id) so each browser-tab conversation is its own
thread but a user can have many past sessions.
"""

from sqlalchemy import (
    Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base


class ConversationTurn(Base):
    __tablename__ = "conversation_turns"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_conv_org"),
                    nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("users.id", name="fk_conv_user"),
                     nullable=False, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user | assistant | tool | system
    content = Column(Text)
    tool_name = Column(String(64), nullable=True)
    tool_args = Column(JSON, nullable=True)
    tool_result = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_conv_session_time", "session_id", "created_at"),
        Index("ix_conv_user_recent", "user_id", "created_at"),
    )

    # relationships
    organization = relationship("Organization")
    user = relationship("User")

    def serialize(self) -> dict:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "tool_name": self.tool_name,
            "tool_args": self.tool_args,
            "tool_result": self.tool_result,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
