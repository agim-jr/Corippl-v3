# backend/app/services/preference_service.py

from sqlalchemy.orm import Session
from ..models.preference import Preference
from ..models.user import User
from typing import Dict, Any
import logging
from fastapi import HTTPException, status
from typing import Dict, Any

logger = logging.getLogger(__name__)

def get_user_preferences(db: Session, user_id: int) -> Preference:
    """Get a user's preferences, creating default preferences if none exist"""
    try:
        preference = db.query(Preference).filter(Preference.user_id == user_id).first()
        if not preference:
            preference = Preference(user_id=user_id)
            db.add(preference)
            db.commit()
            db.refresh(preference)
        return preference
    except Exception as e:
        db.rollback()
        logger.error(f"Error getting/creating preferences for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user preferences"
        )

def update_user_preferences(db: Session, user_id: int, preferences: Dict[str, Any]) -> Preference:
    """Update a user's preferences"""
    try:
        preference = get_user_preferences(db, user_id)

        # Update only the fields that are provided
        for key, value in preferences.items():
            if hasattr(preference, key):
                setattr(preference, key, value)

        db.commit()
        db.refresh(preference)
        return preference
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating preferences for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user preferences"
        )
