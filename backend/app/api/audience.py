# backend/app/api/audience.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.audience import Audience
from app.models.schemas import AudienceCreate, AudienceResponse, AudienceUpdate
from app.services.audience_service import AudienceService, update_audience_scores  # <-- import here
from app.utils.dependencies import get_db, get_current_user, admin_required
from app.models.user import User
import logging

logger = logging.getLogger(__name__)  # <-- define logger

router = APIRouter(
    prefix="/audience",
    tags=["Audience"],
    responses={status.HTTP_404_NOT_FOUND: {"description": "Not Found"}},
)

@router.post("/update-scores", status_code=status.HTTP_200_OK)
def trigger_update_audience_scores(
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_required)
):
    """
    Admin endpoint to manually trigger audience score updates.
    """
    try:
        update_audience_scores(db)
        return {"message": "Audience scores updated successfully."}
    except Exception as e:
        logger.error(f"Manual audience score update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to update audience scores.")

@router.get("/{user_id}", response_model=AudienceResponse)
def get_audience(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)  # Replaced with admin_required and type hint as User
):
    """
    Retrieve audience data for a specific user (Admin only).
    """
    audience_service = AudienceService(db)
    audience = audience_service.get_audience_by_user_id(user_id)
    if not audience:
        raise HTTPException(status_code=404, detail="Audience not found")
    return audience
@router.post("/", response_model=AudienceResponse)
def create_or_update_audience(
    audience: AudienceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create or update audience data for the current user.
    If audience data exists, it updates; otherwise, it creates new.
    """
    audience_service = AudienceService(db)
    existing_audience = audience_service.get_audience_by_user_id(current_user['id'])
    if existing_audience:
        updated_audience = audience_service.update_audience(current_user['id'], audience)
        if not updated_audience:
            raise HTTPException(status_code=400, detail="Failed to update audience")
        return updated_audience
    else:
        created_audience = audience_service.create_audience(current_user['id'], audience)
        return created_audience

@router.put("/{user_id}", response_model=AudienceResponse)
def update_audience(
    user_id: int,
    audience_update: AudienceUpdate,
    db: Session = Depends(get_db),
    current_admin: bool = Depends(admin_required)
):
    """
    Update audience data for a specific user (Admin only).
    """
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    audience_service = AudienceService(db)
    updated_audience = audience_service.update_audience(user_id, audience_update)
    if not updated_audience:
        raise HTTPException(status_code=404, detail="Audience not found")
    return updated_audience

@router.delete("/{user_id}", status_code=204)
def delete_audience(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: bool = Depends(admin_required)
):
    """
    Delete audience data for a specific user (Admin only).
    """
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    audience_service = AudienceService(db)
    success = audience_service.delete_audience(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Audience not found")
    return

@router.get("/", response_model=List[AudienceResponse])
def list_audiences(
    db: Session = Depends(get_db),
    current_admin: bool = Depends(admin_required)
):
    """
    Retrieve a list of all audience data (Admin only).
    """
    if not current_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    audience_service = AudienceService(db)
    audiences = audience_service.list_all_audiences()
    return audiences
