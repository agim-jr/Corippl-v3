# backend/app/services/queue_service.py

import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.content import Content
from ..models.user import User

logger = logging.getLogger(__name__)

def enqueue_content(db: Session, user: User, content: Content) -> None:
    """
    Enqueue new content by setting its status to 'pending'.
    """
    try:
        content.status = "pending"
        db.add(content)
        db.commit()
        db.refresh(content)
        logger.info(f"Content ID {content.id} enqueued for user '{user.username}'.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error enqueuing content for user '{user.username}': {e}")
        raise

def process_user_queue(db: Session, user: User) -> dict:
    """
    Process queue using 1-for-1 model:
    - User has share credits (user.share_count)
    - Each credit unlocks 1 oldest pending content
    - Returns info about what was unlocked
    """
    try:
        if user.share_count <= 0:
            logger.info(f"User '{user.username}' has no share credits to process queue.")
            return {
                "unlocked": False,
                "content": None,
                "remaining_credits": 0
            }

        # Get oldest pending content
        pending_content = db.query(Content).filter(
            Content.user_id == user.id,
            Content.status == "pending"
        ).order_by(Content.created_at).first()

        if not pending_content:
            logger.info(f"No pending content to process for user '{user.username}'.")
            return {
                "unlocked": False,
                "content": None,
                "remaining_credits": user.share_count,
                "message": "No pending content in queue"
            }

        # Unlock the content
        pending_content.status = "active"
        user.share_count -= 1

        db.commit()
        db.refresh(pending_content)
        db.refresh(user)

        logger.info(
            f"Content ID {pending_content.id} ('{pending_content.title}') "
            f"unlocked for user '{user.username}'. "
            f"Remaining credits: {user.share_count}"
        )

        return {
            "unlocked": True,
            "content": {
                "id": pending_content.id,
                "title": pending_content.title,
                "status": pending_content.status,
                "created_at": pending_content.created_at.isoformat()
            },
            "remaining_credits": user.share_count
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error processing queue for user '{user.username}': {e}")
        raise

def increment_share_count(db: Session, user: User, amount: int = 1) -> None:
    """
    Increments the user's share count (credits) by the specified amount.
    """
    try:
        user.share_count += amount
        db.commit()
        db.refresh(user)
        logger.info(f"User '{user.username}' share_count incremented by {amount}. Total credits: {user.share_count}.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error incrementing share count for user '{user.username}': {e}")
        raise

def reset_share_count(db: Session, user: User) -> None:
    """
    Resets the user's share count to zero.
    """
    try:
        user.share_count = 0
        db.commit()
        db.refresh(user)
        logger.info(f"User '{user.username}' share_count reset to {user.share_count}.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error resetting share count for user '{user.username}': {e}")
        raise

# backend/app/services/queue_service.py

def get_user_queue(db: Session, user_id: int) -> dict:
    """
    Get user's content queue showing:
    1. Pending content (not yet activated)
    2. Active content still needing shares (incomplete)
    3. Active content being circulated (successful)

    🔥 AUTO-UNLOCKS pending content when user has share credits!
    """
    try:
        # Get user to check share credits
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return _empty_queue_response()

        logger.info(f"👤 User {user_id} has {user.share_count} share credits")

        # 🔥 AUTO-UNLOCK: Process pending content if user has share credits
        if user.share_count > 0:
            # Get oldest pending content (FIFO)
            pending_to_unlock = db.query(Content).filter(
                Content.user_id == user_id,
                Content.status == "pending"
            ).order_by(Content.created_at).limit(user.share_count).all()

            if pending_to_unlock:
                unlocked_count = 0
                for content in pending_to_unlock:
                    content.status = "active"
                    user.share_count -= 1
                    unlocked_count += 1
                    logger.info(
                        f"✅ AUTO-UNLOCKED: Content {content.id} '{content.title}' "
                        f"(created {content.created_at})"
                    )

                db.commit()
                logger.info(
                    f"🎉 AUTO-UNLOCK COMPLETE: {unlocked_count} content item(s) unlocked. "
                    f"Remaining credits: {user.share_count}"
                )

                # Refresh user to get updated share_count
                db.refresh(user)

        # Get PENDING content (waiting to be activated)
        pending_content = db.query(Content).filter(
            Content.user_id == user_id,
            Content.status == "pending"
        ).order_by(Content.created_at).all()

        logger.info(f"📋 Found {len(pending_content)} pending content items")

        # Get ACTIVE content that still needs shares (INCOMPLETE)
        incomplete_active = db.query(Content).filter(
            Content.user_id == user_id,
            Content.status.in_(["active", "enhanced"]),
            Content.share_count < func.coalesce(Content.required_shares, 1)
        ).order_by(Content.created_at).all()

        logger.info(f"⏳ Found {len(incomplete_active)} incomplete active content items")

        # Get ACTIVE content that has met its goal (SUCCESSFUL)
        successful_active = db.query(Content).filter(
            Content.user_id == user_id,
            Content.status.in_(["active", "enhanced"]),
            Content.share_count >= func.coalesce(Content.required_shares, 1)
        ).order_by(Content.share_count.desc()).all()

        logger.info(f"🎯 Found {len(successful_active)} successful/circulating content items")

        # Build queue items for INCOMPLETE content (pending + incomplete active)
        queue_items = []

        # Add pending content
        for content in pending_content:
            queue_items.append({
                "id": content.id,
                "title": content.title,
                "shares_required": content.required_shares or 5,
                "shares_needed": content.required_shares or 5,
                "current_shares": 0,
                "created_at": content.created_at.isoformat(),
                "status": "pending"
            })

        # Add incomplete active content
        for content in incomplete_active:
            queue_items.append({
                "id": content.id,
                "title": content.title,
                "shares_required": content.required_shares or 5,
                "shares_needed": max(0, (content.required_shares or 5) - content.share_count),
                "current_shares": content.share_count,
                "created_at": content.created_at.isoformat(),
                "status": "active"
            })

        # Build items for SUCCESSFUL content (actively circulating)
        circulating_items = []
        for content in successful_active:
            circulating_items.append({
                "id": content.id,
                "title": content.title,
                "shares_required": content.required_shares or 5,
                "current_shares": content.share_count,
                "shares_beyond_goal": content.share_count - (content.required_shares or 5),
                "created_at": content.created_at.isoformat(),
                "status": content.status,
                "is_high_performer": content.share_count >= (content.required_shares or 5) * 2
            })

        # Calculate circulation metrics
        total_circulating_shares = sum(item["current_shares"] for item in circulating_items)
        avg_shares_per_content = (
            round(total_circulating_shares / len(circulating_items), 1)
            if circulating_items else 0
        )
        high_performers_count = sum(
            1 for item in circulating_items
            if item.get("is_high_performer", False)
        )

        logger.info(
            f"📊 QUEUE SUMMARY for user {user_id}:\n"
            f"  - Pending: {len(pending_content)}\n"
            f"  - Incomplete Active: {len(incomplete_active)}\n"
            f"  - Circulating: {len(successful_active)}\n"
            f"  - Share Credits: {user.share_count}\n"
            f"  - Total Shares: {total_circulating_shares}\n"
            f"  - Avg Shares/Content: {avg_shares_per_content}\n"
            f"  - High Performers: {high_performers_count}"
        )

        return {
            # Queue section (content needing help)
            "queue_size": len(pending_content) + len(incomplete_active),
            "pending_count": len(pending_content),
            "active_count": len(incomplete_active),
            "queue_items": queue_items,
            "share_credits": user.share_count,

            # Circulating section with calculated metrics
            "circulating_count": len(successful_active),
            "circulating_items": circulating_items,
            "total_active_content": len(incomplete_active) + len(successful_active),
            "total_circulating_shares": total_circulating_shares,
            "avg_shares_per_content": avg_shares_per_content,
            "high_performers_count": high_performers_count,

            # Opportunities
            "opportunities": []
        }

    except Exception as e:
        db.rollback()
        logger.error(f"❌ ERROR getting queue for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return _empty_queue_response()


def _empty_queue_response() -> dict:
    """Helper function for empty queue response"""
    return {
        "queue_size": 0,
        "pending_count": 0,
        "active_count": 0,
        "queue_items": [],
        "share_credits": 0,
        "circulating_count": 0,
        "circulating_items": [],
        "total_active_content": 0,
        "total_circulating_shares": 0,
        "avg_shares_per_content": 0,
        "high_performers_count": 0,
        "opportunities": []
    }
