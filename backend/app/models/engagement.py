# backend/app/models/engagement.py

from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class ContactEngagement(Base):
    """
    Track anonymous engagement patterns for contact recommendations.
    NO personal data stored - only aggregated metrics.
    """
    __tablename__ = "contact_engagements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)

    # Engagement metrics (anonymous aggregation)
    total_clicks = Column(Integer, default=0)
    total_shares_sent = Column(Integer, default=0)
    last_engagement_at = Column(DateTime, nullable=True)

    # Category affinity (what types of content they engage with)
    preferred_categories = Column(String, default="")  # JSON string of category engagement

    # Engagement score (calculated by AI)
    engagement_score = Column(Float, default=0.0)

    # Timing preferences (when they typically engage)
    best_send_hour = Column(Integer, nullable=True)  # 0-23

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="contact_engagements")
    contact = relationship("Contact", backref="engagement_data")


class AnonymousEngagementEvent(Base):
    """
    Store anonymous engagement events for ML training.
    Uses hashed identifiers - no email addresses stored.
    """
    __tablename__ = "anonymous_engagement_events"

    id = Column(Integer, primary_key=True, index=True)

    # Hashed identifier (NOT the actual email)
    contact_hash = Column(String(64), nullable=False, index=True)

    # What happened
    event_type = Column(String(50), nullable=False)  # "click", "view", "share"

    # Context (no personal info)
    content_category = Column(String(100), nullable=True)
    content_type = Column(String(50), nullable=True)

    # When it happened
    event_timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Device/context (for timing analysis)
    hour_of_day = Column(Integer, nullable=True)
    day_of_week = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
