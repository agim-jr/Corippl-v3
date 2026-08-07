# backend/app/api/flag_routes.py

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
import logging
from datetime import datetime, timedelta

from ..models.schemas import FlagCreate, FlagResponse, ContentResponse
from ..services.flag_service import FlagService
from ..utils.dependencies import get_db, admin_required, get_current_user
from ..models.user import User
from ..models.flag import Flag

# Configure logger for this module
logger = logging.getLogger("flag_routes")
logger.setLevel(logging.DEBUG)
if not logger.hasHandlers():
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

router = APIRouter(
    prefix="/flags",
    tags=["Flags"],
)

# Valid status values for content
VALID_STATUSES = ["flagged", "under_review", "approved", "deleted", "pending"]

@router.post("/", response_model=FlagResponse, status_code=status.HTTP_201_CREATED)
def create_flag(
    flag: FlagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.debug(f"User '{current_user.username}' is creating a new flag.")
    try:
        new_flag = FlagService.create_flag(db, flag, current_user.id)
        logger.debug(f"Flag created successfully with ID {new_flag.id}")
        return new_flag
    except HTTPException as ex:
        logger.error(f"HTTPException while creating flag: {ex.detail}")
        raise ex
    except Exception as e:
        logger.error(f"Unexpected error while creating flag: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create flag."
        )

@router.get("/", response_model=List[FlagResponse])
def get_flags(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    logger.debug(f"Admin user '{current_user.username}' is retrieving all flags.")
    try:
        flags = FlagService.get_all_flags(db)
        logger.debug(f"Number of flags retrieved: {len(flags)}")
        return flags
    except HTTPException as ex:
        logger.error(f"HTTPException while retrieving flags: {ex.detail}")
        raise ex
    except Exception as e:
        logger.error(f"Unexpected error while retrieving flags: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve flags."
        )

@router.get("/stats", response_model=dict)
def get_flag_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    """Get flag statistics for admin dashboard."""
    logger.debug(f"Admin user '{current_user.username}' is retrieving flag statistics.")
    try:
        from ..models.content import Content

        stats = {
            "total_flags": db.query(Flag).count(),
            "flagged_content": db.query(Flag).join(Content).filter(Content.status == "flagged").count(),
            "under_review": db.query(Flag).join(Content).filter(Content.status == "under_review").count(),
            "approved": db.query(Flag).join(Content).filter(Content.status == "approved").count(),
            "deleted": db.query(Flag).join(Content).filter(Content.status == "deleted").count(),
            "flags_last_24h": db.query(Flag).filter(
                Flag.created_at >= datetime.utcnow() - timedelta(days=1)
            ).count(),
            "unique_flagged_content": db.query(Flag.content_id).distinct().count(),
            "unique_flaggers": db.query(Flag.user_id).distinct().count()
        }
        logger.debug(f"Flag statistics retrieved: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Error getting flag stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve flag statistics."
        )

@router.get("/{flag_id}", response_model=FlagResponse)
def get_flag(
    flag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    logger.debug(f"Admin user '{current_user.username}' is retrieving flag with ID {flag_id}.")
    try:
        flag = FlagService.get_flag_by_id(db, flag_id)
        return flag
    except HTTPException as ex:
        logger.error(f"HTTPException while retrieving flag: {ex.detail}")
        raise ex
    except Exception as e:
        logger.error(f"Unexpected error while retrieving flag: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve flag."
        )

@router.delete("/{flag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flag(
    flag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    logger.debug(f"Admin user '{current_user.username}' is deleting flag with ID {flag_id}.")
    try:
        FlagService.delete_flag(db, flag_id)
        logger.debug(f"Flag with ID {flag_id} deleted successfully.")
        return
    except HTTPException as ex:
        logger.error(f"HTTPException while deleting flag: {ex.detail}")
        raise ex
    except Exception as e:
        logger.error(f"Unexpected error while deleting flag: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete flag."
        )

@router.put("/{flag_id}/content-status", response_model=ContentResponse)
def update_content_status(
    flag_id: int,
    new_status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    """Update the status of the content associated with a specific flag."""

    # Validate status
    if new_status not in VALID_STATUSES:
        logger.error(f"Invalid status '{new_status}' provided by admin '{current_user.username}'.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
        )

    logger.debug(f"Admin user '{current_user.username}' is updating status for content related to flag {flag_id} to {new_status}.")
    try:
        # Retrieve the flag to get associated content
        flag = db.query(Flag).filter(Flag.id == flag_id).first()
        if not flag:
            logger.error(f"Flag with ID {flag_id} not found.")
            raise HTTPException(status_code=404, detail="Flag not found.")

        # Update content status
        updated_content = FlagService.update_content_status(db, flag.content_id, new_status)
        logger.debug(f"Content ID {updated_content.id} status updated to {new_status}.")
        return updated_content
    except HTTPException as ex:
        logger.error(f"HTTPException while updating content status: {ex.detail}")
        raise ex
    except Exception as e:
        logger.error(f"Unexpected error while updating content status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update content status."
        )

@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
def bulk_delete_flags(
    flag_ids: List[int] = Body(..., embed=True, example={"flag_ids": [1, 2, 3]}),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    """Bulk delete flags by their IDs."""
    logger.debug(f"Admin user '{current_user.username}' is bulk deleting flags with IDs {flag_ids}.")
    try:
        FlagService.bulk_delete_flags(db, flag_ids)
        logger.debug(f"Flags with IDs {flag_ids} deleted successfully.")
        return {"detail": "Flags deleted successfully."}
    except HTTPException as ex:
        logger.error(f"HTTPException during bulk delete: {ex.detail}")
        raise ex
    except Exception as e:
        logger.error(f"Unexpected error during bulk delete: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk delete flags."
        )
