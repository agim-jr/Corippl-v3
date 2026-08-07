# backend/app/api/content.py

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..database import get_db
from ..models.schemas import ContentCreate, ContentResponse, ContentUpdate, FlagCreate, FlagResponse, LinkResponse
from ..services import content_service
from ..utils.dependencies import get_current_user
from ..models.user import User
from ..models.content import Content, ContentTypeEnum
from ..models.flag import Flag  # Correct import
from ..services.shuffle_service import shuffle_matches, get_remaining_shuffles
from datetime import timedelta  # ✅ ADD THIS LINE
from ..utils.s3 import s3_manager  # 🔥 NEW: Import S3 manager
from ..config import settings  # 🔥 NEW: Import settings
import uuid  # 🔥 NEW: For generating unique filenames
import json  # 🔥 NEW: For parsing categories
from ..services.queue_service import get_user_queue


router = APIRouter(
    prefix="/content",
    tags=["Content"]
)

# Configure logger
logger = logging.getLogger("content_api")
logger.setLevel(logging.DEBUG)  # Set to DEBUG to capture all logs
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

@router.post("/", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def submit_content(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    url: str = Form(...),
    content_type: str = Form(...),
    required_shares: Optional[int] = Form(5),
    categories: str = Form("[]"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"User '{current_user.username}' is submitting new content: {title}")

    media_url = None

    if file:
        try:
            file_content = await file.read()
            file_size_mb = len(file_content) / (1024 * 1024)

            if file_size_mb > settings.MAX_FILE_SIZE_MB:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
                )

            file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
            unique_filename = f"content/{current_user.id}/{uuid.uuid4()}.{file_extension}"

            media_url = s3_manager.upload_file(
                file_content=file_content,
                file_name=unique_filename,
                content_type=file.content_type
            )

            if not media_url:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to upload file to storage"
                )

            logger.info(f"File uploaded successfully: {media_url}")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file"
            )

    try:
        categories_list = json.loads(categories)
    except json.JSONDecodeError:
        categories_list = []

    content_data = {
        "title": title,
        "description": description,
        "url": url,
        "media_url": media_url,
        "content_type": content_type,
        "required_shares": required_shares,
        "categories": categories_list
    }

    try:
        new_content = content_service.submit_content(db, current_user, content_data)

        # ❌ AI ANALYSIS REMOVED - Content will be created without AI analysis
        logger.debug(f"Content '{new_content.title}' submitted successfully with ID {new_content.id}")
        return new_content
    except HTTPException as he:
        logger.error(f"HTTP Exception submitting content: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error submitting content: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/match", response_model=List[ContentResponse])
def get_matched_content(
    ranked_content: Optional[bool] = Query(False, description="Sort content by share_count descending"),
    top_performers: Optional[bool] = Query(False, description="Filter content with share_count >= required_shares"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(
        f"Fetching matched content for user '{current_user.username}' (ID: {current_user.id}) "
        f"with filters - Ranked Content: {ranked_content}, Top Performers: {top_performers}"
    )
    try:
        # Enforce tier-based access for advanced matching features
        if (ranked_content or top_performers) and not current_user.is_premium:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Advanced matching features are available to premium users only."
            )
        matches = content_service.match_content(
            db,
            current_user,
            ranked_content=ranked_content,
            top_performers=top_performers
        )
        logger.debug(f"Number of matches found: {len(matches)}")
        return matches
    except HTTPException as he:
        logger.error(f"HTTP Exception fetching matched content: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error fetching matched content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve matched content."
        )

@router.get("/types", response_model=List[str], status_code=status.HTTP_200_OK)
def get_content_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"Retrieving content types for user '{current_user.username}' (ID: {current_user.id})")
    try:
        types = [ctype.value for ctype in ContentTypeEnum]
        logger.debug(f"Available content types: {types}")
        return types
    except Exception as e:
        logger.error(f"Error fetching content types: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve content types."
        )

@router.get("/", response_model=List[ContentResponse])
def read_contents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"Retrieving all content submitted by user '{current_user.username}' (ID: {current_user.id})")
    contents = content_service.get_all_contents(db, current_user)
    if not contents:
        logger.info(f"No content found for user '{current_user.username}'")
        return []  # Return an empty list instead of raising 404
    return contents

@router.get("/{id}", response_model=ContentResponse)
def read_content(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"Retrieving content with ID {id} for user '{current_user.username}'")

    # Use joinedload to include links relationship
    content = db.query(Content).options(
        joinedload(Content.user),
        joinedload(Content.links)
    ).filter(
        Content.id == id,
        Content.user_id == current_user.id
    ).first()

    # If not owner, allow read-only access if content is pool-approved
    if not content:
        from ..models.pool_submission import PoolSubmission

        pool_approved = db.query(PoolSubmission).filter(
            PoolSubmission.content_id == id,
            PoolSubmission.status == "approved"
        ).first()

        if pool_approved:
            content = db.query(Content).options(
                joinedload(Content.user),
                joinedload(Content.links)
            ).filter(Content.id == id).first()
            logger.debug(
                f"Content ID {id} served via pool approval "
                f"to non-owner '{current_user.username}'"
            )

    if not content:
        logger.warning(f"Content with ID {id} not found for user '{current_user.username}'")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )
    return content

@router.put("/{id}", response_model=ContentResponse)
def update_content(
    id: int,
    content_update: ContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"Updating content with ID {id} for user '{current_user.username}'")
    logger.debug(f"Update data: {content_update.dict(exclude_unset=True)}")

    try:
        update_data = content_update.dict(exclude_unset=True)
        updated_content = content_service.update_content(db, current_user, id, update_data)

        if not updated_content:
            logger.warning(f"Content with ID {id} not found for user '{current_user.username}'")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found."
            )

        # Log the updated content for debugging
        logger.debug(f"Content with ID {id} updated successfully")
        logger.debug(f"New status: {updated_content.status}")
        logger.debug(f"Returning content: {updated_content}")

        # Ensure we refresh the object from the database
        db.refresh(updated_content)

        return updated_content

    except ValueError as ve:
        logger.error(f"Validation error updating content ID {id}: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error updating content ID {id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update content."
        )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"Deleting content with ID {id} for user '{current_user.username}'")
    deleted = content_service.delete_content(db, current_user, id)
    if not deleted:
        logger.warning(f"Content with ID {id} not found for user '{current_user.username}'")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )
    logger.debug(f"Content with ID {id} deleted successfully")
    return

@router.post("/{id}/share/", response_model=ContentResponse)
def share_content(
    id: int,
    share_data: dict = Body(...),  # This will contain contact_ids
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"User '{current_user.username}' is sharing content ID {id}")
    try:
        contact_ids = share_data.get("contact_ids", [])
        updated_content = content_service.share_content(db, current_user, id, contact_ids)
        logger.debug(f"Content ID {id} shared successfully")
        return updated_content
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error sharing content ID {id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{id}/enhance/", response_model=ContentResponse)
def enhance_content_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"User '{current_user.username}' is enhancing content ID {id}")
    try:
        enhanced_content = content_service.enhance_content(db, current_user, id)
        logger.debug(f"Content ID {id} enhanced successfully")
        return enhanced_content
    except HTTPException as e:
        logger.error(f"Error enhancing content ID {id}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error enhancing content ID {id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enhance content."
        )

@router.post("/{id}/create-trackable-link", response_model=dict)
def create_trackable_link_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a trackable short link for premium users.
    Returns the newly created link information.
    """
    print(f"\n{'='*60}")
    print(f"🚨 ENDPOINT HIT! content_id={id}, user_id={current_user.id}")
    print(f"{'='*60}\n")

    logger.debug(f"User '{current_user.username}' is creating trackable link for content ID {id}")

    # Check if user is premium
    print(f"✅ Checking premium status: {current_user.is_premium}")
    if not current_user.is_premium:
        print("❌ User is not premium!")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only premium users can create trackable links."
        )

    # Get the content
    print(f"✅ Fetching content {id}...")
    content = db.query(Content).filter(
        Content.id == id,
        Content.user_id == current_user.id
    ).first()

    if not content:
        print(f"❌ Content {id} not found!")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )

    print(f"✅ Content found: {content.title}")

    if not content.url:
        print("❌ Content has no URL!")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content must have a URL to create trackable link."
        )

    print(f"✅ Content URL: {content.url}")

    try:
        # Import link service
        print("✅ Importing link service...")
        from ..services.link_service import create_short_link

        # Create the trackable link
        print(f"✅ Calling create_short_link(db, user, {id})...")
        link = create_short_link(db, current_user, id)
        print(f"✅ Link created: {link.short_code}")

        # ✅ ADD THIS: Put content into circulation when trackable link is created
        if content.status == "pending":
            print(f"✅ Activating content {id}...")
            content.status = "active"
            db.commit()
            db.refresh(content)
            logger.info(f"Content ID {id} activated upon trackable link creation")

        logger.debug(f"Trackable link created successfully for content ID {id}: {link.short_code}")

        result = {
            "success": True,
            "link": {
                "id": link.id,
                "short_code": link.short_code,
                "click_count": link.click_count,
                "created_at": link.created_at.isoformat()
            },
            "full_url": f"/links/{link.short_code}",
            "content_activated": content.status == "active"
        }

        print(f"✅ Returning result: {result}")
        return result

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"❌ EXCEPTION CAUGHT!")
        print(f"❌ Type: {type(e).__name__}")
        print(f"❌ Message: {str(e)}")
        print(f"{'='*60}\n")

        import traceback
        traceback.print_exc()

        logger.error(f"Error creating trackable link for content ID {id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create trackable link."
        )


@router.post("/shuffle", response_model=List[ContentResponse])
def shuffle_content(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Shuffle and retrieve a new set of content matches.
    """
    shuffled = shuffle_matches(db, current_user)
    return shuffled

# ADD this endpoint to backend/app/api/content.py
@router.get("/shuffles/remaining", response_model=dict)
def get_remaining_shuffles_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current shuffle status including bonus shuffles"""

    if current_user.is_premium:
        return {
            "is_premium": True,
            "remaining_shuffles": "Unlimited",
            "bonus_shuffles": 0,
            "total_shuffles": "Unlimited"
        }

    regular_shuffles = current_user.remaining_shuffles or 0
    bonus_shuffles = current_user.bonus_shuffles or 0
    total_shuffles = regular_shuffles + bonus_shuffles

    return {
        "is_premium": False,
        "remaining_shuffles": regular_shuffles,
        "bonus_shuffles": bonus_shuffles,
        "total_shuffles": total_shuffles,
        "next_reset": current_user.last_shuffle_reset + timedelta(days=1) if current_user.last_shuffle_reset else None
    }

@router.post("/guest/{guest_content_id}/share", response_model=dict)
def share_guest_content_endpoint(
    guest_content_id: int,
    share_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Share guest content and award bonus shuffles.
    """
    contact_ids = share_data.get("contact_ids", [])
    result = content_service.share_guest_content(db, current_user.id, guest_content_id, contact_ids)
    return result


# Add this to backend/app/api/content.py

@router.patch("/{id}/auto-share", response_model=ContentResponse)
def toggle_auto_share(
    id: int,
    auto_share: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle auto-share status for a specific content item
    """
    logger.debug(f"User '{current_user.username}' toggling auto_share for content ID {id} to {auto_share}")

    content = db.query(Content).filter(
        Content.id == id,
        Content.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )

    # Update auto_share status
    content.auto_share = auto_share
    db.commit()
    db.refresh(content)

    logger.info(f"Content ID {id} auto_share set to {auto_share}")
    return content

@router.get("/queue/status", response_model=dict)
def get_queue_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed queue status for the current user
    """
    logger.debug(f"Fetching queue status for user '{current_user.username}'")
    try:
        queue_data = get_user_queue(db, current_user.id)
        return queue_data
    except Exception as e:
        logger.error(f"Error fetching queue status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve queue status."
        )
