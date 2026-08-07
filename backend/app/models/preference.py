# backend/app/models/preference.py

from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    # Email notification preferences
    email_content_shared = Column(Boolean, default=True)  # When someone shares my content
    email_content_shared_milestone = Column(Boolean, default=True)  # When content reaches share milestones
    email_daily_digest = Column(Boolean, default=False)  # Daily summary of activities
    email_weekly_stats = Column(Boolean, default=True)  # Weekly performance stats
    email_marketing = Column(Boolean, default=True)  # Marketing emails and platform updates

    user = relationship("User", back_populates="preferences")
