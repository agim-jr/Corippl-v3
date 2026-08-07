# backend/app/models/audience.py

from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, Float, func
from sqlalchemy.orm import relationship
from .base import Base

class Audience(Base):
    __tablename__ = "audiences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    demographics = Column(JSON, nullable=True)  # e.g., {"age": 30, "gender": "Male", "location": "USA"}
    interests = Column(JSON, nullable=True)      # e.g., ["Technology", "Health", "Art"]
    interaction_patterns = Column(JSON, nullable=True)  # e.g., {"average_session_length": 5.2, "devices_used": ["Mobile", "Desktop"]}
    score = Column(Float, default=0.0)  # New field for Audience Score
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="audience")
