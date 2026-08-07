# backend/app/services/profile_service.py

from sqlalchemy.orm import Session
from typing import Optional

from ..models.schemas import ProfileCreate, ProfileResponse, ProfileUpdate
from ..models.profile import Profile
import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

def get_profile_by_user_id(db: Session, user_id: int) -> Optional[Profile]:
    return db.query(Profile).filter(Profile.user_id == user_id).first()

def create_profile_service(db: Session, profile: ProfileCreate, user_id: int) -> ProfileResponse:
    try:
        db_profile = Profile(
            user_id=user_id,
            name=profile.name,
            bio=profile.bio,
            categories=profile.categories,
            interests=profile.interests
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating profile for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create profile"
        )

def update_profile_service(db: Session, user_id: int, profile_update: ProfileUpdate) -> Optional[ProfileResponse]:
    try:
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            return None

        # Update fields if they are provided
        if profile_update.name is not None:
            profile.name = profile_update.name
        if profile_update.bio is not None:
            profile.bio = profile_update.bio
        if profile_update.categories is not None:
            profile.categories = profile_update.categories
        if profile_update.interests is not None:
            profile.interests = profile_update.interests
        if profile_update.content_type is not None:
            profile.content_type = profile_update.content_type
        if profile_update.social_links is not None:
            profile.social_links = profile_update.social_links

        db.commit()
        db.refresh(profile)
        return profile
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating profile for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )
