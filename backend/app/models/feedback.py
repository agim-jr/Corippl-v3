# backend/app/models/feedback.py

from sqlalchemy import Column, Integer, String, Text, DateTime, func, Enum as SQLEnum
from .base import Base
import enum

class FeedbackType(str, enum.Enum):
    general = "general"
    support = "support"
    bug = "bug"
    feature = "feature"
    business = "business"

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    feedback_type = Column(SQLEnum(FeedbackType), default=FeedbackType.general, nullable=False)
    status = Column(String(20), default="new", nullable=False)  # new, in_progress, resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
