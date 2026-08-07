from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.models.share import ShareMapping
from app.models.content import Content, Share
from app.models.contact import Contact
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.utils.email import send_share_notification_email
from app.services.queue_service import process_user_queue, increment_share_count
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/share", tags=["share"])

# Request model
class ShareRequest(BaseModel):
    matched_content_id: int
    contact_ids: List[int]

# ✅ NEW: 1-for-1 Share endpoint
@router.post("/")
async def share_content(
    request: ShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Share matched content and earn share credits (1-for-1 model)
    - Sharing earns 1 credit (regardless of # of contacts)
    - 1 credit unlocks 1 oldest pending content
    """

    # 1. Validate matched content exists
    matched_content = db.query(Content).filter(Content.id == request.matched_content_id).first()
    if not matched_content:
        raise HTTPException(status_code=404, detail="Matched content not found")

    # 2. Create share records and send email notifications
    emails_sent = 0
    emails_failed = 0

    for contact_id in request.contact_ids:
        # Create share record for analytics
        share = Share(
            user_id=current_user.id,
            content_id=request.matched_content_id,
            is_ai_automated=False,
            is_first_share=False
        )
        db.add(share)

        # 📧 Send email notification to contact
        try:
            contact = db.query(Contact).filter(Contact.id == contact_id).first()
            if contact and contact.email:
                logger.info(f"📧 Sending share notification to {contact.email}")
                await send_share_notification_email(
                    recipient_email=contact.email,
                    sharer_name=current_user.username,
                    content_title=matched_content.title
                )
                emails_sent += 1
                logger.info(f"✅ Email sent successfully to {contact.email}")
            else:
                logger.warning(f"⚠️ Contact {contact_id} has no email address")
        except Exception as e:
            emails_failed += 1
            logger.error(f"❌ Failed to send email to contact {contact_id}: {str(e)}")
            # Continue with other emails even if one fails

    # 3. Update matched content's share_count (popularity tracking)
    matched_content.share_count = (matched_content.share_count or 0) + len(request.contact_ids)

    # 4. ✅ AWARD 1 SHARE CREDIT (1-for-1 model)
    increment_share_count(db, current_user, amount=1)

    logger.info(
        f"User '{current_user.username}' shared content {request.matched_content_id} "
        f"to {len(request.contact_ids)} contacts. Earned 1 credit. "
        f"Total credits: {current_user.share_count}"
    )

    # 5. ✅ PROCESS QUEUE - Unlock oldest pending content
    unlock_result = process_user_queue(db, current_user)

    # 6. Commit all changes
    db.commit()
    db.refresh(current_user)

    # Refresh matched content to get updated share count
    db.refresh(matched_content)

    # 7. Log email results
    logger.info(
        f"📊 Email Summary: {emails_sent} sent, {emails_failed} failed "
        f"out of {len(request.contact_ids)} contacts"
    )

    # 8. Return comprehensive response
    return {
        "success": True,
        "message": "Content shared successfully",
        "share_details": {
            "matched_content_id": matched_content.id,
            "matched_content_title": matched_content.title,
            "contacts_notified": len(request.contact_ids),
            "emails_sent": emails_sent,
            "emails_failed": emails_failed
        },
        "credits": {
            "earned": 1,
            "remaining": current_user.share_count,
            "total_earned": current_user.share_count  # After processing queue
        },
        "unlock_result": unlock_result,  # Info about what was unlocked (if anything)
        "queue_status": {
            "has_pending": unlock_result.get("unlocked", False) or current_user.share_count > 0
        }
    }

# Get user's content progress
@router.get("/my-content-progress")
async def get_my_content_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all user's content with their unlock progress
    """
    contents = db.query(Content).filter(
        Content.user_id == current_user.id
    ).order_by(Content.created_at.desc()).all()

    return {
        "share_credits": current_user.share_count,  # ✅ NEW: Show available credits
        "contents": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "share_count": c.share_count or 0,
                "required_shares": c.required_shares or 5,
                "status": c.status or "pending",
                "progress_percentage": round(
                    ((c.share_count or 0) / (c.required_shares or 5)) * 100, 1
                ) if (c.required_shares or 5) > 0 else 0,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in contents
        ]
    }

# Get share history for specific content
@router.get("/content/{content_id}/history")
async def get_content_share_history(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get share history for this content
    """
    # Verify content belongs to user
    user_content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()

    if not user_content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Get all shares for this content
    shares = db.query(Share).filter(
        Share.content_id == content_id
    ).order_by(Share.created_at.desc()).all()

    return {
        "user_content": {
            "id": user_content.id,
            "title": user_content.title,
            "total_shares": user_content.share_count or 0,
            "required_shares": user_content.required_shares or 5,
            "status": user_content.status
        },
        "share_history": [
            {
                "id": share.id,
                "shared_by": share.user.username if share.user else "Unknown",
                "is_ai_automated": share.is_ai_automated,
                "shared_at": share.created_at.isoformat() if share.created_at else None
            }
            for share in shares
        ]
    }
