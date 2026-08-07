# backend/app/models/profile.py

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, func, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from .base import Base  # Ensure base.py defines Base correctly

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    bio = Column(String(500), nullable=True)
    categories = Column(ARRAY(String), nullable=False, default=[])  # Updated to ARRAY
    interests = Column(ARRAY(String), nullable=False, default=[])    # Updated to ARRAY
    content_type = Column(String(100), nullable=True)
    social_links = Column(JSONB, default={}, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ✅ ADD THESE NEW AI FIELDS
    ai_embedding = Column(JSON, nullable=True)
    ai_topics = Column(JSON, nullable=True)
    ai_tone = Column(String(50), nullable=True)
    ai_target_audience = Column(JSON, nullable=True)
    ai_profile_strength = Column(Integer, default=0)
    ai_key_phrases = Column(JSON, nullable=True)
    ai_last_analyzed = Column(DateTime, nullable=True)


    # Relationship
    user = relationship("User", back_populates="profile")
