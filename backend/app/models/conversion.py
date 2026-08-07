# backend/app/models/conversion.py

from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, JSON, func
from sqlalchemy.orm import relationship
from .base import Base

class Conversion(Base):
    __tablename__ = "conversions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=True)  # Updated here
    conversion_type = Column(String, index=True, nullable=False)  # e.g., "signup", "purchase"
    details = Column(JSON, nullable=True)  # Additional details about the conversion
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="conversions")
    content = relationship("Content", back_populates="conversions")
