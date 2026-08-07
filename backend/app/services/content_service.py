# backend/app/services/content_service.py

import random
import logging
import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta, datetime
from jinja2 import Template, Environment, FileSystemLoader
from sqlalchemy import or_, func, case, and_, text
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from fastapi import HTTPException, status

# Models
from ..models.content import Content, ContentTypeEnum
from ..models.flag import Flag
from ..models.profile import Profile
from ..models.user import User
from ..models.contact import Contact

# Services
from .queue_service import enqueue_content, process_user_queue, increment_share_count
from .analytics_service import increment_total_content_shares, increment_successful_cross_promotions
from .subscription_service import check_premium_status
from .notification_service import create_content_share_notification
from .sharing_utils import perform_content_share

# Utils
from ..utils.email import EmailSchema
from ..config import settings
from ..database import SessionLocal

# Pool service import
from .pool_service import PoolService

# Initialize logger
logger = logging.getLogger(__name__)


def search_content(
    db: Session,
    user: User,
    query: str,
    content_type: Optional[List[str]] = None,
    categories: Optional[List[str]] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    min_views: Optional[int] = None,
    sort_by: str = "relevance"
) -> List[Content]:
    """
    Search for content based on various filters.
    Only accessible to premium users.
    """
    if not user.is_premium:
        logger.warning(f"User '{user.username}' attempted to access premium search.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only premium users can perform advanced searches."
        )

    # Base query filters
    filters = or_(
        Content.title.ilike(f"%{query}%"),
        Content.description.ilike(f"%{query}%"),
        Content.categories.any(f"%{query.lower()}%")
    )

    if content_type:
        filters = and_(filters, Content.content_type.in_([ct.lower() for ct in content_type]))

    if categories:
        filters = and_(filters, Content.categories.overlap([cat.lower() for cat in categories]))

    if date_from:
        filters = and_(filters, Content.created_at >= date_from)

    if date_to:
        filters = and_(filters, Content.created_at <= date_to)

    if min_views is not None:
        filters = and_(filters, Content.view_count >= min_views)

    # Sorting
    if sort_by == "date":
        order = Content.created_at.desc()
    elif sort_by == "views":
        order = Content.view_count.desc()
    else:
        # Default relevance sorting (could be improved with full-text search ranking)
        order = Content.share_count.desc()

    contents_query = db.query(Content).filter(filters).order_by(order)

    contents = contents_query.all()

    logger.info(f"User '{user.username}' performed a search. Results found: {len(contents)}")

    return contents


def submit_content(db: Session, user: User, content_data: dict) -> Content:
    """
    Allows a user to submit new content.
    Content starts as 'pending' and becomes 'active' when user has shares available.
    Enforces weekly submission limits for Free Tier users.
    **AUTO-SUBMITS TO POOL FOR REVIEW**
    """
    try:
        today = date.today()

        # Reset weekly_submission_count if last_submission_date is more than 7 days ago
        if user.last_submission_date < today - timedelta(days=7):
            user.weekly_submission_count = 0
            user.last_submission_date = today
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.debug(f"Weekly submission count reset for user '{user.username}'.")

        if not user.is_premium:
            if user.weekly_submission_count >= 3:
                logger.warning(f"User '{user.username}' has reached the weekly submission limit.")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Weekly submission limit reached. Upgrade to premium for unlimited submissions."
                )
            user.weekly_submission_count += 1
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.debug(f"User '{user.username}' submission count incremented to {user.weekly_submission_count}.")

        # Ensure content_type is of type ContentTypeEnum
        try:
            content_type = ContentTypeEnum(content_data['content_type'])
        except ValueError:
            logger.error(f"Invalid content type: {content_data['content_type']}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content type: {content_data['content_type']}"
            )

        # ✅ CREATE CONTENT WITH PENDING STATUS
        content = Content(
            title=content_data['title'],
            description=content_data.get('description'),
            url=str(content_data['url']),
            media_url=content_data.get('media_url'),
            content_type=content_type,
            categories=[cat.strip().lower() for cat in content_data.get('categories', [])],
            user_id=user.id,
            status="pending",
            share_count=0,
            required_shares=content_data.get('required_shares', 5)
        )

        db.add(content)
        db.commit()
        db.refresh(content)

        logger.info(
            f"✅ Content '{content.title}' (ID: {content.id}) created with status='pending' "
            f"for user '{user.username}' (share_count={user.share_count})"
        )

        # 🔥 AUTO-SUBMIT TO POOL FOR REVIEW
        try:
            pool_entry = PoolService.auto_submit_from_regular_content(
                db=db,
                content_id=content.id,
                user_id=user.id,
                original_url=content.url,
                title=content.title,
                categories=content.categories or [],
                pitch=content.description
            )
            logger.info(f"✅ Content {content.id} auto-submitted to Pool: {pool_entry.id}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to auto-submit content {content.id} to Pool: {e}")
            # Don't fail content creation if Pool submission fails

        # ✅ AUTO-PROCESS QUEUE IF USER HAS SHARES
        if user.share_count > 0:
            try:
                logger.info(f"🔄 Processing queue for user '{user.username}' with {user.share_count} credits...")
                result = process_user_queue(db, user)
                db.refresh(content)
                logger.info(
                    f"📊 Queue processed: unlocked={result.get('unlocked', False)}, "
                    f"content_id={content.id}, new_status='{content.status}', "
                    f"remaining_credits={result.get('remaining_credits', 0)}"
                )
            except Exception as e:
                logger.error(f"❌ Error processing queue after content submission: {e}")

        # ✅ Eager load relationships
        content = db.query(Content).options(
            joinedload(Content.links),
            joinedload(Content.user)
        ).filter(Content.id == content.id).first()

        logger.info(
            f"🎉 Content submission complete: ID={content.id}, status='{content.status}', "
            f"user_shares={user.share_count}"
        )
        return content

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in submit_content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit content: {str(e)}"
        )


def match_content(
    db: Session,
    user: User,
    ranked_content: bool = False,
    top_performers: bool = False
) -> List[Content]:
    """
    Match content based on the user's categories and interests.
    """

    # Get user's profile for interest-based matching
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    # INCLUSIVE MATCHING FOR ALL USERS (Premium and Free)
    logger.info(f"Using inclusive matching for user: {user.username} (Premium: {user.is_premium})")

    # Get user categories
    user_categories = []
    if profile and profile.categories:
        user_categories = [cat.strip().lower() for cat in profile.categories]

    # Base query - ALL active content from other users
    base_query = db.query(Content).join(User).options(joinedload(Content.user)).filter(
        Content.user_id != user.id,
        Content.status.in_(["active", "enhanced"])
    )

    # If user has profile, use interests for better matching but still show all content
    if profile:
        interests = [interest.strip().lower() for interest in profile.interests] if profile.interests else []

        # Build preference filters (for sorting, not excluding)
        preference_score_case = case(
            # Higher score for matching categories
            *[(Content.categories.overlap([cat]), 10) for cat in user_categories],
            # Higher score for matching interests in title/description
            *[(or_(Content.title.ilike(f"%{interest}%"), Content.description.ilike(f"%{interest}%")), 5)
              for interest in interests],
            else_=1  # Base score for all other content
        )
    else:
        # No profile preferences
        preference_score_case = case(else_=1)

    # Apply top performers filter if requested
    if top_performers:
        base_query = base_query.filter(Content.share_count >= Content.required_shares)

    # Sorting logic
    if ranked_content:
        if user.is_premium:
            # Premium users get sophisticated sorting
            premium_creator_case = case((User.is_premium, 10), else_=1)
            base_query = base_query.order_by(
                (preference_score_case * premium_creator_case).desc(),
                Content.share_count.desc(),
                Content.view_count.desc(),
                Content.created_at.desc()
            )
        else:
            # Free users get simpler sorting
            base_query = base_query.order_by(
                preference_score_case.desc(),
                Content.share_count.desc(),
                Content.created_at.desc()
            )
    else:
        # Default sorting: preferences first, then recency
        base_query = base_query.order_by(
            preference_score_case.desc(),
            Content.created_at.desc()
        )

    # Get content with pagination
    total_limit = 100 if user.is_premium else 50
    regular_contents = base_query.limit(total_limit).all()

    # Mark all as regular content
    for content in regular_contents:
        content.is_guest = False

    logger.info(f"Inclusive matching found {len(regular_contents)} contents for {user.username}")
    return regular_contents


def get_all_contents(db: Session, user: User, skip: int = 0, limit: int = 10) -> List[Content]:
    """
    Retrieve all content submitted by the authenticated user with pagination.
    """
    return db.query(Content).options(joinedload(Content.user)).filter(Content.user_id == user.id).offset(skip).limit(limit).all()


def get_content_by_id(db: Session, user: User, content_id: int) -> Optional[Content]:
    """
    Retrieve a single content item by ID for the authenticated user.
    """
    return db.query(Content).options(joinedload(Content.user)).filter(Content.id == content_id, Content.user_id == user.id).first()


def update_content(db: Session, user: User, content_id: int, update_data: dict) -> Optional[Content]:
    """
    Update a content item if it belongs to the authenticated user.
    """
    content = db.query(Content).filter(Content.id == content_id, Content.user_id == user.id).first()
    if not content:
        return None
    for key, value in update_data.items():
        if key == "url" and isinstance(value, str):  # Ensure URL is a string
            setattr(content, key, value)
        elif key == "url" and hasattr(value, "url"):  # Handle HttpUrl type
            setattr(content, key, str(value))
        else:
            setattr(content, key, value)
    db.commit()
    db.refresh(content)
    return content


def delete_content(db: Session, user: User, content_id: int) -> bool:
    """
    Delete a content item if it belongs to the authenticated user.
    """
    content = db.query(Content).filter(Content.id == content_id, Content.user_id == user.id).first()
    if not content:
        return False
    db.delete(content)
    db.commit()
    return True


def share_content(db: Session, user: User, content_id: int, contact_ids: List[int] = None) -> Content:
    """
    Allows a user to share another user's content with specific contacts.
    Enforces daily share limits for free users.
    Increments share counts and processes queued content based on thresholds.
    Also sends emails to contacts with the shared content.
    Tracks view counts based on number of contacts reached.
    """
    if contact_ids is None:
        contact_ids = []

    # ✅ Get content with single query
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        logger.warning(f"Content with ID {content_id} not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )

    # ✅ Check if user is trying to share their own content
    if content.user_id == user.id:
        logger.warning(f"User '{user.username}' attempted to share their own content ID {content_id}.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot share your own content."
        )

    # ✅ Check if content is shareable
    if content.status not in ["active", "enhanced"]:
        logger.warning(f"Content ID {content_id} has status '{content.status}' and cannot be shared.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content cannot be shared. Current status: {content.status}"
        )

    TODAY = date.today()

    # ✅ Check daily share limits for free users
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

    # ✅ Increment the content's share_count
    content.share_count += 1

    # ✅ Track user's OUTGOING shares
    user.outgoing_shares_count = (user.outgoing_shares_count or 0) + 1

    logger.info(
        f"Content ID {content.id} shared by user '{user.username}' with {len(contact_ids)} contacts. "
        f"Total shares: {content.share_count}, Total views: {content.view_count}"
    )

    # ✅ Send emails to contacts
    if contact_ids:
        logger.info(f"Content ID {content.id} shared with contacts: {contact_ids}")

        try:
            # Get contact information
            contacts = db.query(Contact).filter(Contact.id.in_(contact_ids)).all()

            # Use the professional template from templates folder
            import os
            template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
            env = Environment(loader=FileSystemLoader(template_dir))
            template = env.get_template("shared_content.html")

            # Render the email HTML
            html_content = template.render(
                sharer_username=user.username,
                content=content,
                base_url=settings.FRONTEND_URL,
                signup_url=f"{settings.FRONTEND_URL}/signup"
            )

            # Send email to each contact
            for contact in contacts:
                if hasattr(contact, 'email') and contact.email:
                    logger.info(f"Preparing to send content share email to contact: {contact.email}")

                    email = EmailSchema(
                        email=[contact.email],
                        subject=f"{user.username} shared content with you: {content.title}",
                        body=html_content
                    )

                    def run_async_email(email_data):
                        from ..utils.email import send_email
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        try:
                            loop.run_until_complete(send_email(email_data))
                            logger.info(f"Email sent successfully to {email_data.email[0]}")
                        except Exception as e:
                            logger.error(f"Failed to send email: {str(e)}")
                        finally:
                            loop.close()

                    email_thread = threading.Thread(target=run_async_email, args=(email,))
                    email_thread.start()
                    logger.info(f"Email thread started for sending to {contact.email}")

                else:
                    logger.warning(f"Contact ID {contact.id} has no valid email address")

        except Exception as e:
            logger.error(f"Error in email sending process: {str(e)}")

    # ✅ Commit changes
    db.commit()
    db.refresh(content)

    # ✅ Increment user's total_content_shares analytics
    increment_total_content_shares(db, user.id)

    if not user.is_premium:
        # Increment daily_share_count
        user.daily_share_count += 1
        db.commit()
        logger.info(f"User '{user.username}' has shared {user.daily_share_count} times today.")

        # Check if user's shares meet threshold for releasing queued content
        SHARE_THRESHOLD = 5
        if user.daily_share_count >= SHARE_THRESHOLD:
            process_user_queue(db, user)
            increment_successful_cross_promotions(db, user.id)
            logger.info(f"User '{user.username}' has met the share threshold. Released queued content.")

    # ✅ Create notification for content owner
    create_content_share_notification(db, content, user)

    # ✅ Perform additional share operations
    return perform_content_share(db, user, content_id, contact_ids)


def flag_content(db: Session, user: User, content_id: int, reason: str, is_guest_content: bool = False) -> Flag:
    """
    Allows a user to flag content with a reason.
    """
    if is_guest_content:
        logger.warning(f"Guest content flagging attempted but feature is disabled")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest content feature is not available"
        )

    # Check regular content
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        logger.warning(f"Content with ID {content_id} not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )

    # Check if the user has already flagged this content
    existing_flag = db.query(Flag).filter(
        Flag.content_id == content_id,
        Flag.user_id == user.id,
        Flag.is_guest_content == False
    ).first()

    if existing_flag:
        logger.warning(f"User '{user.username}' has already flagged content ID {content_id}.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already flagged this content."
        )

    # Create new flag
    flag = Flag(
        content_id=content_id,
        user_id=user.id,
        reason=reason,
        is_guest_content=False
    )
    db.add(flag)
    db.commit()
    db.refresh(flag)

    # Auto-moderate: If content gets 3+ flags, temporarily hide it
    flag_count = db.query(Flag).filter(
        Flag.content_id == content_id,
        Flag.is_guest_content == False
    ).count()

    if flag_count >= 3:
        content.status = "flagged"
        db.commit()
        logger.warning(f"Content ID {content_id} auto-hidden due to {flag_count} flags")

    logger.info(f"Content ID {content_id} flagged by user '{user.username}' for reason: {reason}")
    return flag


def delete_content_by_admin(db: Session, content_id: int) -> bool:
    """
    Allows an admin to delete any content by its ID.
    """
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        return False

    db.delete(content)
    db.commit()
    return True


def enhance_content(db: Session, user: User, content_id: int) -> Content:
    """
    Enhances a specific content item.
    For example, this could set the content status to 'enhanced' or trigger some processing.
    """
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )

    # Example Enhancement Logic:
    # You can customize this based on what "enhancing" a content means in your application.
    content.status = "enhanced"  # Update status or perform other modifications
    db.commit()
    db.refresh(content)

    return content


def get_shuffled_matches(db: Session, user: User) -> list:
    """
    Returns a shuffled subset of content matches based on user tier.
    Premium users receive all matches; non-premium receive limited matches.
    """
    if user.is_premium:
        matches = db.query(Content).filter(
            Content.user_id != user.id,
            Content.status.in_(["active", "enhanced"])
        ).all()
    else:
        all_matches = db.query(Content).filter(
            Content.user_id != user.id,
            Content.status.in_(["active", "enhanced"])
        ).all()
        matches = random.sample(all_matches, min(len(all_matches), 10))
    return matches


def share_content_legacy(db: Session, content_id: int, sharer_user_id: int):
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise ValueError("Content not found")

    # Implement share logic; e.g., increment share_count
    content.share_count += 1
    db.commit()
    db.refresh(content)

    # Fetch sharer user
    sharer_user = db.query(User).filter(User.id == sharer_user_id).first()
    if not sharer_user:
        raise ValueError("Sharer user not found")

    # Create notification
    create_content_share_notification(db, content, sharer_user)

    return content


def share_guest_content(db: Session, user_id: int, guest_content_id: int, contact_ids: List[int]):
    """
    Guest content feature disabled
    """
    logger.warning(f"Guest content sharing attempted but feature is disabled")
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Guest content feature is not available"
    )
