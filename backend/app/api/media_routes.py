from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import magic
from io import BytesIO

from ..database import get_db
from ..utils.dependencies import get_current_user
from ..models.user import User
from ..utils.s3 import S3Manager
from ..config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/media", tags=["Media"])

# Initialize S3Manager
s3_manager = S3Manager()

# File size limit (100MB default)
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB in bytes

# Allowed MIME types
ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
]

ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo"  # .avi
]

def validate_file_size(file: UploadFile) -> bool:
    """Check if file size is within limits."""
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()  # Get size
    file.file.seek(0)  # Reset to start

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    return True

def validate_file_type(file: UploadFile, allowed_types: list) -> str:
    """Validate file MIME type and return it."""
    try:
        # Read first 2KB to detect MIME type
        file_header = file.file.read(2048)
        file.file.seek(0)  # Reset

        mime_type = magic.from_buffer(file_header, mime=True)

        if mime_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{mime_type}'. Allowed types: {', '.join(allowed_types)}"
            )

        return mime_type

    except Exception as e:
        logger.error(f"File type validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail="Could not determine file type"
        )

@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an image file to S3.

    Returns:
        - url: Public S3 URL of uploaded image
        - file_type: MIME type
        - file_name: Original filename
    """
    try:
        # Validate file size
        validate_file_size(file)

        # Validate file type
        mime_type = validate_file_type(file, ALLOWED_IMAGE_TYPES)

        # Read file content
        file_content = await file.read()
        file_obj = BytesIO(file_content)

        # Upload to S3 (images folder)
        file_url = s3_manager.upload_file(
            file_obj,
            file.filename,
            content_type=mime_type
        )

        logger.info(f"User {current_user.id} uploaded image: {file_url}")

        return {
            "url": file_url,
            "file_type": mime_type,
            "file_name": file.filename,
            "message": "Image uploaded successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )

@router.post("/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a video file to S3.

    Returns:
        - url: Public S3 URL of uploaded video
        - file_type: MIME type
        - file_name: Original filename
    """
    try:
        # Validate file size
        validate_file_size(file)

        # Validate file type
        mime_type = validate_file_type(file, ALLOWED_VIDEO_TYPES)

        # Read file content
        file_content = await file.read()
        file_obj = BytesIO(file_content)

        # Upload to S3 (videos folder)
        file_url = s3_manager.upload_file(
            file_obj,
            file.filename,
            content_type=mime_type
        )

        logger.info(f"User {current_user.id} uploaded video: {file_url}")

        return {
            "url": file_url,
            "file_type": mime_type,
            "file_name": file.filename,
            "message": "Video uploaded successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload video: {str(e)}"
        )

@router.delete("/delete")
async def delete_media(
    file_url: str = Query(..., description="Full S3 URL of file to delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a media file from S3.

    Args:
        file_url: Full S3 URL (e.g., https://bucket.s3.amazonaws.com/file.jpg)
    """
    try:
        # Extract filename from URL
        # Example: https://echo-bucket.s3.amazonaws.com/images/abc123.jpg -> images/abc123.jpg
        parts = file_url.split(f"{settings.AWS_S3_BUCKET_NAME}.s3")
        if len(parts) < 2:
            raise HTTPException(
                status_code=400,
                detail="Invalid S3 URL format"
            )

        # Get the path after the bucket domain
        key = parts[1].split("/", 2)[-1]  # Remove leading slash and region

        # Delete from S3
        success = s3_manager.delete_file(key)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete file from S3"
            )

        logger.info(f"User {current_user.id} deleted media: {key}")

        return {
            "message": "File deleted successfully",
            "deleted_url": file_url
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Media deletion failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete media: {str(e)}"
        )

@router.get("/health")
async def media_health_check():
    """Check if media service is operational."""
    try:
        # Test S3 connection
        s3_manager.s3_client.list_buckets()

        return {
            "status": "healthy",
            "s3_connected": True,
            "bucket": settings.AWS_S3_BUCKET_NAME
        }
    except Exception as e:
        logger.error(f"Media health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="Media service unavailable"
        )
