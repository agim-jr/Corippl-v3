# backend/app/api/admin_content_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.services.content_service import delete_content_by_admin
from app.utils.dependencies import get_db, admin_required

router = APIRouter(
    prefix="/admin/content",
    tags=["Admin Content Management"],
    dependencies=[Depends(admin_required)],  # Ensure all routes require admin
)

@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_content(content_id: int, db: Session = Depends(get_db)):
    success = delete_content_by_admin(db, content_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found or already deleted.",
        )
    return
