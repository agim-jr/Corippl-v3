# backend/app/services/sharing_utils.py

import logging
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException, status

from ..models.content import Content
from ..models.user import User
from .analytics_service import increment_total_content_shares
from .notification_service import create_content_share_notification

logger = logging.getLogger(__name__)

# backend/app/services/sharing_utils.py

def perform_content_share(
    db: Session,
    user: User,
    content_id: int,
    contact_ids: List[int] = None,
    is_ai_automated: bool = False  # 🔥 NEW PARAMETER
) -> Content:
    """
    Shared utility function for content sharing logic.
    This avoids circular imports between content_service and ai_service.
    """
    if contact_ids is None:
        contact_ids = []

    try:
        # Use a raw SQL query to check the status directly from the database
        from sqlalchemy import text
        result = db.execute(
    text("SELECT status FROM contents WHERE id = :content_id"),
    {"content_id": content_id}
).fetchone()
        if not result:
            logger.warning(f"Content with ID {content_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found."
            )

        # Log the actual database status
        actual_status = result[0]
        logger.warning(f"Actual database status for content {content_id}: '{actual_status}'")

        # Now get the content object for other operations
        content = db.query(Content).filter(Content.id == content_id).first()

        # Force update the status from what we got from the database
        content.status = actual_status

        if content.user_id == user.id:
            logger.warning(f"User '{user.username}' attempted to share their own content ID {content_id}.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot share your own content."
            )

        # ✅ FIXED: Allow both "active" and "enhanced" content to be shared
        if actual_status not in ["active", "enhanced"]:
            logger.warning(f"Content ID {content_id} is not shareable (status: {actual_status}).")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content cannot be shared in its current state."
            )

        TODAY = date.today()

        if not user.is_premium:
            # Reset daily_share_count if last_share_date is not today
            if user.last_share_date != TODAY:
                user.daily_share_count = 0
                user.last_share_date = TODAY
                db.commit()
                logger.info(f"Daily share count reset for user '{user.username}'.")

            if user.daily_share_count >= 3:
                logger.warning(f"Free user '{user.username}' has reached the daily share limit.")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Daily share limit reached. Upgrade to premium for unlimited sharing."
                )

        # ✅ INCREMENT VIEW COUNT - Track how many people will see this content
        views_to_add = len(contact_ids) if contact_ids else 1
        content.view_count = (content.view_count or 0) + views_to_add

        # 🔥 NEW: Create Share record
        from ..models.content import Share
        new_share = Share(
            content_id=content_id,
            user_id=user.id,
            is_ai_automated=is_ai_automated,  # 🔥 TRACK AI AUTOMATION
            created_at=datetime.utcnow()
        )
        db.add(new_share)

        # Increment the content's share_count
# ✅ SOLUTION: Database-level atomic increment
        db.execute(
            text("""
                UPDATE contents
                SET share_count = share_count + 1,
                    view_count = view_count + :views
                WHERE id = :content_id
            """),
            {"content_id": content_id, "views": views_to_add}
        )

        # Refresh to get updated counts
        db.refresh(content)

        logger.info(
            f"Content ID {content.id} shared by user '{user.username}' "
            f"(AI: {is_ai_automated}) with {len(contact_ids)} contacts. "
            f"Total shares: {content.share_count}, Total views: {content.view_count}"
        )

        db.commit()
        db.refresh(content)

        # Increment user's total_content_shares
        increment_total_content_shares(db, user.id)

        if not user.is_premium:
            # Increment daily_share_count
            user.daily_share_count += 1
            db.commit()
            logger.info(f"User '{user.username}' has shared {user.daily_share_count} times today.")

        # Create notification for content owner
        create_content_share_notification(db, content, user)

        return content

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in perform_content_share: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error sharing content"
        )
