# backend/app/api/onboarding.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User
from app.models.share import ShareMapping
from app.models.content import Content, Share
from app.api.auth import get_current_user
from datetime import datetime, timedelta
import random
import os
import logging

logger = logging.getLogger(__name__)

# ✅ ADD PREFIX HERE - this combines with /api from main.py
router = APIRouter(prefix="/onboarding", tags=["onboarding"])  # ✅ ADD PREFIX



# ============================================
# ENDPOINT 1: Check if modal should show
# ============================================
@router.get("/should-show-modal")
async def should_show_modal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Determine if the first-share reward modal should be shown to the user
    """
    logger.info(f"🔍 Checking modal status for user: {current_user.username} (ID: {current_user.id})")

    # Check if user has shared before
    has_shared = db.query(Share).filter(
        Share.user_id == current_user.id
    ).first() is not None

    logger.info(f"🔍 User has shared before: {has_shared}")

    # If user has already shared, don't show modal
    if has_shared:
        logger.info("🔍 User has already shared content - not showing modal")
        return {
            "should_show": False,
            "reason": "already_shared",
            "has_shared_before": True
        }

    # Rest of your existing logic...
    has_seen_modal = getattr(current_user, 'has_seen_share_reward_modal', False)
    total_rewards = getattr(current_user, 'share_rewards_claimed', 0)

    logger.info(f"🔍 Has seen modal: {has_seen_modal}, Total rewards: {total_rewards}")

    # Show modal if user hasn't seen it before
    should_show = not has_seen_modal

    # Mark as seen
    if not has_seen_modal:
        current_user.has_seen_share_reward_modal = True
        db.commit()
        logger.info(f"✅ Marked modal as seen for {current_user.username}")

    return {
        "should_show": should_show,
        "reason": "first_time" if not has_seen_modal else "already_seen",
        "has_shared_before": has_shared,
        "total_rewards_claimed": total_rewards
    }

# ============================================
# ENDPOINT 2: Get first share status
# ============================================
@router.get("/first-share-status")  # ✅ No /onboarding prefix needed
async def get_first_share_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if user can participate in first-share reward program
    """
    logger.info(f"🎯 Checking first share status for {current_user.username}")

    last_reward_time = getattr(current_user, 'last_share_reward_time', None)
    total_rewards = getattr(current_user, 'share_rewards_claimed', 0)

    now = datetime.utcnow()
    REWARD_COOLDOWN_HOURS = 24

    if last_reward_time:
        time_since_last = now - last_reward_time
        hours_remaining = REWARD_COOLDOWN_HOURS - (time_since_last.total_seconds() / 3600)

        if hours_remaining > 0:
            next_available = last_reward_time + timedelta(hours=REWARD_COOLDOWN_HOURS)
            logger.info(f"⏳ User in cooldown: {round(hours_remaining, 1)}h remaining")
            return {
                "eligible": False,
                "reason": "cooldown",
                "next_available": next_available.isoformat(),
                "hours_remaining": round(hours_remaining, 1),
                "total_rewards_claimed": total_rewards,
                "show_modal": False
            }

    logger.info(f"✅ User eligible for reward")
    return {
        "eligible": True,
        "reason": "available",
        "next_available": None,
        "hours_remaining": 0,
        "total_rewards_claimed": total_rewards,
        "show_modal": True
    }

# ============================================
# ENDPOINT 3: Get content to share
# ============================================
def generate_dynamic_social_posts(content: Content, creator: User, share_url: str) -> dict:
    """
    Generate dynamic, personalized social media posts
    """

    title = content.title
    description = content.description or ""
    content_type = content.content_type.value if hasattr(content.content_type, 'value') else str(content.content_type)
    creator_name = creator.username or creator.email.split('@')[0]

    # Content type specific configuration
    type_config = {
        'article': {'emoji': '📰', 'verb': 'Read', 'hook': 'Just discovered this insightful article'},
        'video': {'emoji': '🎬', 'verb': 'Watch', 'hook': 'This video completely changed my perspective'},
        'podcast': {'emoji': '🎙️', 'verb': 'Listen to', 'hook': 'This podcast episode is a must-listen'},
        'code': {'emoji': '💻', 'verb': 'Check out', 'hook': 'Found some brilliant code'},
        'blog': {'emoji': '✍️', 'verb': 'Read', 'hook': 'This blog post is incredibly valuable'},
    }

    config = type_config.get(content_type.lower(), {
        'emoji': '📦',
        'verb': 'Check out',
        'hook': 'Just discovered this'
    })

    # Twitter post (280 char limit)
    twitter_post = f"""{config['emoji']} {config['hook']}!

"{title}"

{config['verb']} it here: {share_url}"""

    if len(twitter_post) > 280:
        twitter_post = f"""{config['emoji']} {title[:100]}...

{share_url}"""

    # LinkedIn post
    desc_preview = description[:200] if len(description) > 200 else description
    if len(description) > 200:
        desc_preview += "..."

    linkedin_post = f"""I wanted to share this valuable {content_type} I recently discovered:

{config['emoji']} {title}

{desc_preview}

{config['verb']} the full {content_type}: {share_url}

#ContentSharing #Learning"""

    return {
        "twitter": twitter_post.strip(),
        "linkedin": linkedin_post.strip(),
    }


@router.get("/share-reward-content")  # ✅ No /onboarding prefix needed
async def get_share_reward_content(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get REAL matched content with DYNAMIC social posts
    """
    logger.info(f"📦 Getting share content for {current_user.username}")

    # Get content from ShareMapping
    share_mappings = db.query(ShareMapping).filter(
        ShareMapping.user_id == current_user.id
    ).all()

    if not share_mappings:
        # Fallback: get any active content from other users
        logger.info("No share mappings, using fallback content")
        available_content = db.query(Content).filter(
            Content.user_id != current_user.id,
            Content.status.in_(['active', 'enhanced'])
        ).order_by(desc(Content.share_count)).limit(50).all()
    else:
        content_ids = [sm.matched_content_id for sm in share_mappings]
        logger.info(f"Found {len(content_ids)} mapped content items")
        available_content = db.query(Content).filter(
            Content.id.in_(content_ids),
            Content.status.in_(['active', 'enhanced'])
        ).order_by(desc(Content.share_count)).all()

    if not available_content:
        logger.warning("No content available to share")
        raise HTTPException(
            status_code=404,
            detail="No content available to share. Check back later!"
        )

    # Filter out already shared content
    already_shared_ids = db.query(Share.content_id).filter(
        Share.user_id == current_user.id
    ).all()
    shared_ids = [s[0] for s in already_shared_ids]

    unshared_content = [c for c in available_content if c.id not in shared_ids]
    pool = unshared_content if unshared_content else available_content

    # Pick from top performers
    pool.sort(key=lambda x: x.share_count or 0, reverse=True)
    selected_content = random.choice(pool[:5])

    logger.info(f"✅ Selected content: {selected_content.title}")

    # Get creator info
    creator = db.query(User).filter(User.id == selected_content.user_id).first()
    if not creator:
        creator = type('User', (), {'username': 'Anonymous', 'email': 'unknown@example.com'})()

    # Generate share URL
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    share_url = f"{frontend_url}/content/{selected_content.id}"

    # Generate dynamic posts
    social_posts = generate_dynamic_social_posts(selected_content, creator, share_url)

    return {
        "content_id": selected_content.id,
        "title": selected_content.title,
        "description": selected_content.description,
        "content_type": selected_content.content_type.value if hasattr(selected_content.content_type, 'value') else str(selected_content.content_type),
        "content_url": selected_content.url,
        "share_count": selected_content.share_count,
        "created_at": selected_content.created_at.isoformat(),
        "creator": {
            "id": creator.id if hasattr(creator, 'id') else 0,
            "username": creator.username,
            "email": creator.email
        },
        "share_url": share_url,
        "pre_written_posts": social_posts
    }

# ============================================
# ENDPOINT 4: Claim the reward
# ============================================
@router.post("/claim-share-reward")  # ✅ No /onboarding prefix needed
async def claim_share_reward(
    request_body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    User clicked share button - give them the reward!
    """
    logger.info(f"🎁 Processing reward claim for {current_user.username}")

    # Extract from request body
    platform = request_body.get("platform")
    content_id = request_body.get("content_id")

    if not platform or not content_id:
        raise HTTPException(status_code=400, detail="Missing platform or content_id")

    # Verify eligibility
    last_reward_time = getattr(current_user, 'last_share_reward_time', None)
    REWARD_COOLDOWN_HOURS = 24

    if last_reward_time:
        time_since_last = datetime.utcnow() - last_reward_time
        hours_since = time_since_last.total_seconds() / 3600

        if hours_since < REWARD_COOLDOWN_HOURS:
            logger.warning(f"⏳ User tried to claim too soon: {round(hours_since, 1)}h since last claim")
            raise HTTPException(
                status_code=400,
                detail=f"You can claim another reward in {round(REWARD_COOLDOWN_HOURS - hours_since, 1)} hours"
            )

    # Verify content exists
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    # Grant 1 day premium trial
    current_premium_until = getattr(current_user, 'premium_until', None)
    if current_premium_until and current_premium_until > datetime.utcnow():
        new_expiry = current_premium_until + timedelta(days=1)
    else:
        new_expiry = datetime.utcnow() + timedelta(days=1)

    current_user.premium_until = new_expiry
    current_user.is_premium = True

    # Update tracking
    current_user.last_share_reward_time = datetime.utcnow()
    current_user.share_rewards_claimed = getattr(current_user, 'share_rewards_claimed', 0) + 1

    # Log the share
    new_share = Share(
        user_id=current_user.id,
        content_id=content_id,
        is_ai_automated=False,
        is_first_share=True,
        created_at=datetime.utcnow()
    )
    db.add(new_share)

    # Increment content share count
    content.share_count = (content.share_count or 0) + 1

    db.commit()
    db.refresh(current_user)

    logger.info(f"✅ Reward granted! Premium until: {new_expiry}")

    return {
        "success": True,
        "reward_type": "premium_trial",
        "reward_value": "1 day",
        "message": "You've unlocked 1 day of Premium features!",
        "next_reward_available": (datetime.utcnow() + timedelta(hours=REWARD_COOLDOWN_HOURS)).isoformat(),
        "total_rewards_earned": current_user.share_rewards_claimed,
        "premium_expires": new_expiry.isoformat()
    }

@router.get("/user-share-status")
async def get_user_share_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if user has ever shared content before
    """
    # Check if user has any shares in the database
    has_shared = db.query(Share).filter(
        Share.user_id == current_user.id
    ).first() is not None

    # Also check the new field if it exists
    user_has_shared = getattr(current_user, 'has_shared_content', False) or has_shared

    return {
        "has_shared_before": user_has_shared,
        "total_shares": db.query(Share).filter(Share.user_id == current_user.id).count(),
        "user_id": current_user.id
    }

# ✅ Log router initialization
logger.info(f"🔧 Onboarding router initialized with {len(router.routes)} routes")
for route in router.routes:
    logger.info(f"  Route: {route.path} [{', '.join(route.methods)}]")
