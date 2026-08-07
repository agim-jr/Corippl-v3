# backend/app/api/conversions.py

from typing import List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.conversion import Conversion
from app.models.schemas import ConversionCreate, ConversionResponse
from app.services.conversion_service import ConversionService
from app.utils.dependencies import get_db, get_current_user, admin_required  # Updated import
from app.models.user import User  # Imported User model


router = APIRouter(
    prefix="/conversions",
    tags=["Conversions"],
    responses={status.HTTP_404_NOT_FOUND: {"description": "Not Found"}},
)

@router.post("/", response_model=ConversionResponse)
def record_conversion(
    conversion: ConversionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Assuming this should still use get_current_user
):
    """
    Record a new conversion event for the current user.
    """
    if conversion.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot record conversions for other users.")
    conversion_service = ConversionService(db)
    return conversion_service.record_conversion(conversion)

@router.get("/", response_model=List[ConversionResponse])
def get_all_conversions(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),  # Updated dependency
):
    """
    Retrieve all conversion events (Admin only).
    """
    conversion_service = ConversionService(db)
    return conversion_service.get_all_conversions()

@router.get("/content/{content_id}/metrics", response_model=Dict[int, Dict[str, int]])
def get_conversion_metrics(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),  # Updated dependency
):
    """
    Retrieve conversion metrics for a specific content item (Admin only).
    """
    conversion_service = ConversionService(db)
    metrics = conversion_service.get_conversion_metrics([content_id])
    return metrics

@router.get("/user/{user_id}", response_model=List[ConversionResponse])
def get_user_conversions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),  # Updated dependency
):
    """
    Retrieve all conversions for a specific user (Admin only).
    """
    conversion_service = ConversionService(db)
    return conversion_service.get_conversions_by_user(user_id)

@router.get("/content/{content_id}", response_model=List[ConversionResponse])
def get_content_conversions(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),  # Updated dependency
):
    """
    Retrieve all conversions for a specific content (Admin only).
    """
    conversion_service = ConversionService(db)
    return conversion_service.get_conversions_by_content(content_id)
