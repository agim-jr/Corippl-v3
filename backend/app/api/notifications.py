# backend/app/api/notifications.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import logging  # Add this line


from ..models import schemas
from ..services.notification_service import (
    get_notifications_for_user,
    create_notification,
    mark_notification_as_read,
)
from ..database import get_db
from ..utils.dependencies import get_current_user  # << Use your real auth
from ..models.user import User

logger = logging.getLogger(__name__)  # Add this line after imports

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
    responses={404: {"description": "Not Found"}},
)

@router.get("/", response_model=List[schemas.Notification])
def read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        user_id = current_user.id
        notifications = get_notifications_for_user(db, user_id)
        return notifications
    except Exception as e:
        logger.error(f"Error fetching notifications for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notifications: {str(e)}"
        )

@router.post("/", response_model=schemas.Notification, status_code=status.HTTP_201_CREATED)
def create_new_notification(
    notification: schemas.NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    if notification.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to create notification for this user.")
    return create_notification(db, notification)

@router.put("/{notification_id}/read", response_model=schemas.Notification)
def update_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    notification = mark_notification_as_read(db, user_id, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification
