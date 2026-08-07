# backend/app/models/analytics.py

from sqlalchemy import Column, Integer, ForeignKey, Float
from sqlalchemy.dialects.postgresql import JSON  # ✅ Use PostgreSQL JSON type
from sqlalchemy.orm import relationship
from .base import Base

class UserAnalytics(Base):
    __tablename__ = 'user_analytics'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    total_content_shares = Column(Integer, default=0, nullable=False)
    successful_cross_promotions = Column(Integer, default=0, nullable=False)

    # New fields
    best_content_types = Column(JSON, nullable=True, default=lambda: {})  # Track performance by content type
    share_ratio = Column(Float, default=0.0)  # Ratio of own vs. others' content
    engagement_by_hour = Column(JSON, nullable=True, default=lambda: {})  # Track engagement patterns by hour

    user = relationship("User", back_populates="analytics")
