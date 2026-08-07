# backend/app/models/content.py

from enum import Enum
from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, Enum as SqlEnum, Boolean, Float
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base


class ContentTypeEnum(str, Enum):
    # Core content types (what the content actually is)
    article = "article"
    video = "video"
    image = "image"
    pdf = "pdf"
    code = "code"
    audio = "audio"
    podcast = "podcast"
    presentation = "presentation"
    thread = "thread"
    link = "link"
    note = "note"
    newsletter = "newsletter"
    blog = "blog"

    # Legacy content types
    technology = "technology"
    art = "art"
    health = "health"
    science = "science"


class Content(Base):
    __tablename__ = 'contents'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    content_type = Column(SqlEnum(ContentTypeEnum), nullable=False)
    categories = Column(ARRAY(Text), nullable=False, default=list)
    status = Column(Text, nullable=False, default="pending")
    share_count = Column(Integer, default=0)
    required_shares = Column(Integer, default=1)
    auto_share = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_ai_automated = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)

    # Pool-related metrics
    pool_review_count = Column(Integer, default=0)
    pool_average_rating = Column(Float, default=0.0)
    pool_claim_count = Column(Integer, default=0)

    content_length = Column(Integer, nullable=True)
    engagement_score = Column(Float, default=0.0)
    popularity_score = Column(Float, default=0.0)

    # Core relationships
    user = relationship("User", back_populates="contents")
    flags = relationship("Flag", back_populates="content", cascade="all, delete-orphan")
    conversions = relationship("Conversion", back_populates="content")
    shares = relationship("Share", back_populates="content", cascade="all, delete-orphan")
    links = relationship("Link", back_populates="content", cascade="all, delete-orphan")  # ADD THIS LINE


    # Pool relationships
    pool_submission = relationship("PoolSubmission", back_populates="content", uselist=False)
    pool_reviews = relationship("PoolReview", back_populates="content", cascade="all, delete-orphan")



class Share(Base):
    __tablename__ = 'shares'

    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey('contents.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_ai_automated = Column(Boolean, default=False, nullable=False)
    is_first_share = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    content = relationship("Content", back_populates="shares")
    user = relationship("User")

# backend/app/models/content.py

class Link(Base):
    """
    Link model for storing URLs associated with content.
    Used for embedded links, references, related URLs, and shortened URLs.
    """
    __tablename__ = "links"

    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey('contents.id', ondelete='CASCADE'), nullable=False)

    # Link details
    url = Column(Text, nullable=False)
    title = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    # Short URL tracking (for URL shortener feature)
    short_code = Column(Text, nullable=True, unique=True, index=True)  # ← ADD THIS
    click_timestamps = Column(ARRAY(Text), nullable=True)  # ← ADD THIS

    # Metadata
    click_count = Column(Integer, default=0, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship back to content
    content = relationship("Content", back_populates="links")

    def __repr__(self):
        return f"<Link(id={self.id}, url='{self.url[:50]}...', short_code='{self.short_code}')>"
