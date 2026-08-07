# backend/app/api/preferences.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..models.user import User
from ..utils.dependencies import get_db, get_current_user
from ..services.preference_service import get_user_preferences, update_user_preferences
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/preferences", tags=["preferences"])

class EmailPreferencesUpdate(BaseModel):
    email_content_shared: Optional[bool] = None
    email_content_shared_milestone: Optional[bool] = None
    email_daily_digest: Optional[bool] = None
    email_weekly_stats: Optional[bool] = None
    email_marketing: Optional[bool] = None

@router.get("/")
def read_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current user's preferences"""
    preferences = get_user_preferences(db, current_user.id)
    return preferences

@router.put("/email")
def update_email_preferences(
    preferences: EmailPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update email notification preferences"""
    # Filter out None values to only update provided fields
    update_data = {k: v for k, v in preferences.dict().items() if v is not None}
    updated_preferences = update_user_preferences(db, current_user.id, update_data)
    return updated_preferences
