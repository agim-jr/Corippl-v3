# backend/app/api/profiles.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime  # ✅ ADD THIS
import logging

from ..database import get_db
from ..models.schemas import ProfileCreate, ProfileResponse, ProfileUpdate, UserProfileResponse
from ..services.profile_service import (
    create_profile_service,
    get_profile_by_user_id,
    update_profile_service,
)
from ..utils.dependencies import get_current_user
from ..models.user import User
from ..models.profile import Profile  # ✅ ADD THIS
from ..services.ai_hybrid_service import get_ai_engine  # ✅ ADD THIS

router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"],
    dependencies=[Depends(get_current_user)]
)

logger = logging.getLogger(__name__)

# ==================== YOUR EXISTING ENDPOINTS (KEEP AS-IS) ====================

@router.post("/", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile_endpoint(
    profile: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if profile already exists
    existing_profile = get_profile_by_user_id(db, user_id=current_user.id)

    if existing_profile:
        logger.info(f"Profile already exists for user ID {current_user.id}, returning existing profile")

        # Ensure has_profile_completed is set
        if not current_user.has_profile_completed:
            current_user.has_profile_completed = True
            db.commit()
            db.refresh(current_user)

        # Return existing profile (change status code to 200 OK)
        return UserProfileResponse(
            profile=existing_profile,
            user=current_user
        )

    # Create new profile
    created_profile = create_profile_service(db, profile, current_user.id)
    logger.info(f"Profile created for user ID {current_user.id}: {created_profile}")

    # Mark profile as completed
    current_user.has_profile_completed = True
    db.commit()
    db.refresh(current_user)

    return UserProfileResponse(
        profile=created_profile,
        user=current_user
    )

@router.get("/{user_id}", response_model=UserProfileResponse)
def get_profile_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = get_profile_by_user_id(db, user_id=user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found."
        )

    profile_owner = db.query(User).filter(User.id == user_id).first()
    if not profile_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return UserProfileResponse(
        profile=profile,
        user=profile_owner
    )

@router.put("/{user_id}", response_model=ProfileResponse)
def update_profile_endpoint(
    user_id: int,
    profile_update: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile."
        )

    updated_profile = update_profile_service(db, user_id, profile_update)
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found."
        )
    logger.info(f"Profile updated for user ID {user_id}: {updated_profile}")
    return updated_profile


# ==================== ✅ NEW AI ENDPOINTS (ADD THESE) ====================

@router.post("/analyze-ai")
def analyze_profile_with_ai(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze user's profile using hybrid AI engine.
    Updates profile with AI insights (topics, tone, audience, strength score).
    """
    # Get user's profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete your profile first."
        )

    # Get AI engine
    ai_engine = get_ai_engine()

    try:
        # Perform analysis
        analysis = ai_engine.analyze_profile(
            bio=profile.bio or "",
            niche=", ".join(profile.categories or []),
            content_description=", ".join(profile.interests or [])
        )

        # Update profile with AI insights
        profile.ai_embedding = analysis.get("embedding", [])
        profile.ai_topics = analysis.get("topics", [])
        profile.ai_tone = analysis.get("tone", "balanced")
        profile.ai_target_audience = analysis.get("target_audience", [])
        profile.ai_profile_strength = analysis.get("profile_strength", 0)
        profile.ai_key_phrases = analysis.get("key_phrases", [])
        profile.ai_last_analyzed = datetime.utcnow()

        db.commit()

        logger.info(f"✅ AI analysis completed for user {current_user.id}")

        return {
            "success": True,
            "analysis": {
                "topics": analysis.get("topics", []),
                "tone": analysis.get("tone", "balanced"),
                "target_audience": analysis.get("target_audience", []),
                "profile_strength": analysis.get("profile_strength", 0),
                "key_phrases": analysis.get("key_phrases", []),
                "suggestions": _generate_profile_suggestions(analysis)
            }
        }

    except Exception as e:
        logger.error(f"AI analysis failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/ai-insights")
def get_ai_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get existing AI insights for user's profile.
    Returns analyzed data if available, otherwise suggests running analysis.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    if not profile.ai_last_analyzed:
        return {
            "success": False,
            "message": "Profile not yet analyzed. Run AI analysis first.",
            "analyzed": False
        }

    return {
        "success": True,
        "analyzed": True,
        "insights": {
            "topics": profile.ai_topics or [],
            "tone": profile.ai_tone or "unknown",
            "target_audience": profile.ai_target_audience or [],
            "profile_strength": profile.ai_profile_strength or 0,
            "key_phrases": profile.ai_key_phrases or [],
            "last_analyzed": profile.ai_last_analyzed.isoformat() if profile.ai_last_analyzed else None
        }
    }


@router.post("/regenerate-ai")
def regenerate_ai_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Force regenerate AI analysis (useful after profile updates).
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    ai_engine = get_ai_engine()

    try:
        # Clear old AI data
        profile.ai_embedding = None
        profile.ai_topics = None
        profile.ai_tone = None
        profile.ai_target_audience = None
        profile.ai_profile_strength = 0
        profile.ai_key_phrases = None

        db.commit()

        # Run fresh analysis
        analysis = ai_engine.analyze_profile(
            bio=profile.bio or "",
            niche=", ".join(profile.categories or []),
            content_description=", ".join(profile.interests or [])
        )

        # Update with new data
        profile.ai_embedding = analysis.get("embedding", [])
        profile.ai_topics = analysis.get("topics", [])
        profile.ai_tone = analysis.get("tone", "balanced")
        profile.ai_target_audience = analysis.get("target_audience", [])
        profile.ai_profile_strength = analysis.get("profile_strength", 0)
        profile.ai_key_phrases = analysis.get("key_phrases", [])
        profile.ai_last_analyzed = datetime.utcnow()

        db.commit()

        logger.info(f"✅ AI analysis regenerated for user {current_user.id}")

        return {
            "success": True,
            "message": "AI analysis regenerated successfully",
            "analysis": {
                "topics": analysis.get("topics", []),
                "tone": analysis.get("tone", "balanced"),
                "target_audience": analysis.get("target_audience", []),
                "profile_strength": analysis.get("profile_strength", 0),
                "key_phrases": analysis.get("key_phrases", [])
            }
        }

    except Exception as e:
        logger.error(f"AI regeneration failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Regeneration failed: {str(e)}"
        )


# ==================== HELPER FUNCTION ====================

def _generate_profile_suggestions(analysis: dict) -> list:
    """Generate actionable suggestions based on AI analysis"""
    suggestions = []

    strength = analysis.get("profile_strength", 0)
    topics = analysis.get("topics", [])
    target_audience = analysis.get("target_audience", [])

    # Strength-based suggestions
    if strength < 30:
        suggestions.append("🔴 Profile needs significant improvement")
        suggestions.append("💡 Add a detailed bio (100+ characters recommended)")
        suggestions.append("💡 Specify your content niche and categories")
    elif strength < 50:
        suggestions.append("🟡 Profile is basic - let's improve it!")
        suggestions.append("💡 Add more details to your bio")
        suggestions.append("💡 Be specific about your content focus")
    elif strength < 70:
        suggestions.append("🟢 Good profile! A few tweaks will help")
        suggestions.append("💡 Consider adding more interests or categories")
    elif strength < 90:
        suggestions.append("✅ Great profile! Very well optimized")
    else:
        suggestions.append("🌟 Excellent profile! Perfect for AI matching")

    # Topic suggestions
    if not topics:
        suggestions.append("💡 Include keywords related to your content focus (e.g., 'productivity', 'tech')")
    elif len(topics) == 1:
        suggestions.append("💡 Consider adding related topics to increase match potential")

    # Audience suggestions
    if not target_audience or target_audience == ["general"]:
        suggestions.append("💡 Describe your target audience more specifically (e.g., 'entrepreneurs', 'students')")

    # Key phrases
    key_phrases = analysis.get("key_phrases", [])
    if not key_phrases:
        suggestions.append("💡 Use more descriptive phrases in your bio")

    return suggestions
