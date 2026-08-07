from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class ShareMapping(Base):
    __tablename__ = "share_mappings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    matched_content_id = Column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False)
    user_content_id = Column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False)
    share_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="share_mappings")
    matched_content = relationship("Content", foreign_keys=[matched_content_id])
    user_content = relationship("Content", foreign_keys=[user_content_id])

    __table_args__ = (
        UniqueConstraint('user_id', 'matched_content_id', 'user_content_id', name='unique_share_mapping'),
    )
