# backend/app/services/flag_service.py

from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from typing import List

from ..models.flag import Flag
from ..models.content import Content
from ..models.schemas import (
    FlagCreate,
    FlagResponse,
    ContentResponse,
    UserResponse,
    NotificationCreate
)
from ..services.notification_service import create_notification
from ..models.user import User

from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger("flag_service")

class FlagService:
    FLAG_THRESHOLD = 5  # Auto-delete threshold
    ESCALATION_THRESHOLD = 3  # Escalation to admin review threshold

    @staticmethod
    def create_flag(db: Session, flag: FlagCreate, user_id: int) -> FlagResponse:
        """Create a new flag for a given content by a user."""
        try:
            # Check if user already flagged this content
            existing_flag = db.query(Flag).filter(
                Flag.content_id == flag.content_id,
                Flag.user_id == user_id
            ).first()

            if existing_flag:
                logger.warning(f"User {user_id} attempted to flag content {flag.content_id} again.")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="You have already flagged this content"
                )

            # Verify if the content exists
            content = db.query(Content).filter(Content.id == flag.content_id).first()
            if not content:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Content not found"
                )

            # Create the Flag object
            db_flag = Flag(
                content_id=flag.content_id,
                user_id=user_id,
                reason=flag.reason
            )
            db.add(db_flag)
            db.commit()
            db.refresh(db_flag)

            # Eagerly load relationships
            flag = db.query(Flag).options(
                joinedload(Flag.content).joinedload(Content.user),
                joinedload(Flag.user)
            ).filter(Flag.id == db_flag.id).first()

            if not flag.content.user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Content creator not found"
                )

            # Set content status to "flagged" if not already escalated
            if content.status not in ["flagged", "under_review", "deleted"]:
                content.status = "flagged"
                db.commit()

            # Send notification to the content owner
            content_owner = flag.content.user
            notification_message = f"Your content '{flag.content.title}' has been flagged for: {flag.reason}."
            try:
                create_notification(db, NotificationCreate(
                    user_id=content_owner.id,
                    message=notification_message
                ))
            except Exception as e:
                logger.warning(f"Failed to send notification to content owner: {e}")

            # Check the number of flags on the content
            flag_count = db.query(Flag).filter(Flag.content_id == content.id).count()
            logger.info(f"Content {content.id} now has {flag_count} flags.")

            # Enhanced escalation logic
            if flag_count >= FlagService.ESCALATION_THRESHOLD and flag_count < FlagService.FLAG_THRESHOLD:
                # Escalate to admin review but don't auto-delete yet
                if content.status != "under_review":
                    content.status = "under_review"
                    db.commit()

                    # Notify all admins of escalation
                    admin_users = db.query(User).filter(User.is_admin == True).all()
                    for admin in admin_users:
                        try:
                            escalation_message = f"Content '{content.title}' has received {flag_count} flags and requires review."
                            create_notification(db, NotificationCreate(
                                user_id=admin.id,
                                message=escalation_message
                            ))
                        except Exception as e:
                            logger.warning(f"Failed to send escalation notification to admin {admin.id}: {e}")
                    logger.info(f"Content {content.id} escalated to admin review with {flag_count} flags.")

            elif flag_count >= FlagService.FLAG_THRESHOLD:
                # Automatically delete the content
                try:
                    # Notify the content owner about deletion first
                    deletion_message = f"Your content '{content.title}' has been deleted due to multiple flags."
                    create_notification(db, NotificationCreate(
                        user_id=content_owner.id,
                        message=deletion_message
                    ))

                    # Notify admins about the deletion
                    admin_users = db.query(User).filter(User.is_admin == True).all()
                    for admin in admin_users:
                        try:
                            admin_notification = f"Content '{content.title}' by user '{content_owner.username}' has been deleted after receiving {flag_count} flags."
                            create_notification(db, NotificationCreate(
                                user_id=admin.id,
                                message=admin_notification
                            ))
                        except Exception as e:
                            logger.warning(f"Failed to send deletion notification to admin {admin.id}: {e}")

                    # Delete the content
                    db.delete(content)
                    db.commit()
                    logger.warning(f"Content {content.id} auto-deleted after {flag_count} flags.")

                except Exception as e:
                    logger.error(f"Error during auto-deletion of content {content.id}: {e}")
                    db.rollback()
                    # Don't raise the exception, just log it and continue

            # Manually construct FlagResponse with proper error handling
            try:
                content_response = ContentResponse(
                    id=flag.content.id,
                    user_id=flag.content.user_id,
                    title=flag.content.title,
                    url=str(flag.content.url),  # Convert to string for HttpUrl compatibility
                    content_type=flag.content.content_type,
                    created_at=flag.content.created_at,
                    status=flag.content.status,
                    share_count=flag.content.share_count,
                    required_shares=flag.content.required_shares,
                    categories=flag.content.categories if flag.content.categories else [],
                    user=UserResponse.from_orm(flag.content.user),
                    view_count=flag.content.view_count,
                    short_link_clicks=getattr(flag.content, 'short_link_clicks', 0),
                    conversions_count=getattr(flag.content, 'conversions_count', 0)
                )

                flag_response = FlagResponse(
                    id=flag.id,
                    content_id=flag.content_id,
                    user_id=flag.user_id,
                    reason=flag.reason,
                    created_at=flag.created_at,
                    content=content_response,
                    user=UserResponse.from_orm(flag.user)
                )

                return flag_response
            except Exception as e:
                logger.error(f"Error constructing response objects: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Flag created but response construction failed"
                )

        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error while creating flag: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while creating the flag."
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error while creating flag: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while creating the flag."
            )

    @staticmethod
    def get_all_flags(db: Session) -> List[FlagResponse]:
        """Retrieve all flags."""
        flags = db.query(Flag).options(
            joinedload(Flag.content).joinedload(Content.user),
            joinedload(Flag.user)
        ).all()

        flag_responses = []
        for flag in flags:
            try:
                if not flag.content.user:
                    continue  # Skip flags where content's user is missing

                content_response = ContentResponse(
                    id=flag.content.id,
                    user_id=flag.content.user_id,
                    title=flag.content.title,
                    url=str(flag.content.url),  # Convert to string
                    content_type=flag.content.content_type,
                    created_at=flag.content.created_at,
                    status=flag.content.status,
                    share_count=flag.content.share_count,
                    required_shares=flag.content.required_shares,
                    categories=flag.content.categories if flag.content.categories else [],
                    user=UserResponse.from_orm(flag.content.user),
                    view_count=flag.content.view_count,
                    short_link_clicks=getattr(flag.content, 'short_link_clicks', 0),
                    conversions_count=getattr(flag.content, 'conversions_count', 0)
                )

                flag_response = FlagResponse(
                    id=flag.id,
                    content_id=flag.content_id,
                    user_id=flag.user_id,
                    reason=flag.reason,
                    created_at=flag.created_at,
                    content=content_response,
                    user=UserResponse.from_orm(flag.user)
                )

                flag_responses.append(flag_response)
            except Exception as e:
                logger.warning(f"Skipping flag {flag.id} due to error: {e}")
                continue

        return flag_responses

    @staticmethod
    def get_flag_by_id(db: Session, flag_id: int) -> FlagResponse:
        """Retrieve a flag by its ID."""
        flag = db.query(Flag).options(
            joinedload(Flag.content).joinedload(Content.user),
            joinedload(Flag.user)
        ).filter(Flag.id == flag_id).first()
        if not flag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flag not found"
            )

        if not flag.content.user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Content creator not found"
            )

        try:
            content_response = ContentResponse(
                id=flag.content.id,
                user_id=flag.content.user_id,
                title=flag.content.title,
                url=str(flag.content.url),  # Convert to string
                content_type=flag.content.content_type,
                created_at=flag.content.created_at,
                status=flag.content.status,
                share_count=flag.content.share_count,
                required_shares=flag.content.required_shares,
                categories=flag.content.categories if flag.content.categories else [],
                user=UserResponse.from_orm(flag.content.user),
                view_count=flag.content.view_count,
                short_link_clicks=getattr(flag.content, 'short_link_clicks', 0),
                conversions_count=getattr(flag.content, 'conversions_count', 0)
            )

            flag_response = FlagResponse(
                id=flag.id,
                content_id=flag.content_id,
                user_id=flag.user_id,
                reason=flag.reason,
                created_at=flag.created_at,
                content=content_response,
                user=UserResponse.from_orm(flag.user)
            )

            return flag_response
        except Exception as e:
            logger.error(f"Error constructing flag response: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error retrieving flag details"
            )

    @staticmethod
    def delete_flag(db: Session, flag_id: int):
        """Delete a flag by its ID."""
        flag = db.query(Flag).filter(Flag.id == flag_id).first()
        if not flag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flag not found"
            )
        db.delete(flag)
        db.commit()

    @staticmethod
    def bulk_delete_flags(db: Session, flag_ids: List[int]):
        """Bulk delete flags by their IDs."""
        try:
            deleted_count = db.query(Flag).filter(Flag.id.in_(flag_ids)).delete(synchronize_session=False)
            db.commit()
            logger.info(f"Bulk deleted {deleted_count} flags.")
            if deleted_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No flags found with the provided IDs."
                )
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error during bulk delete: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while bulk deleting flags."
            )

    @staticmethod
    def update_content_status(db: Session, content_id: int, new_status: str) -> ContentResponse:
        """Update the status of a content item."""
        try:
            content = db.query(Content).filter(Content.id == content_id).first()
            if not content:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Content not found."
                )

            old_status = content.status
            content.status = new_status
            db.commit()
            db.refresh(content)

            # Send notification to the content owner about status change
            if content.user:
                try:
                    notification_message = f"Your content '{content.title}' status has been updated from '{old_status}' to '{new_status}'."
                    create_notification(db, NotificationCreate(
                        user_id=content.user.id,
                        message=notification_message
                    ))
                except Exception as e:
                    logger.warning(f"Failed to send status update notification: {e}")

            # Construct and return the updated ContentResponse
            content_response = ContentResponse(
                id=content.id,
                user_id=content.user_id,
                title=content.title,
                url=str(content.url),  # Convert to string
                content_type=content.content_type,
                created_at=content.created_at,
                status=content.status,
                share_count=content.share_count,
                required_shares=content.required_shares,
                categories=content.categories if content.categories else [],
                user=UserResponse.from_orm(content.user) if content.user else None,
                view_count=content.view_count,
                short_link_clicks=getattr(content, 'short_link_clicks', 0),
                conversions_count=getattr(content, 'conversions_count', 0)
            )

            return content_response

        except HTTPException:
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating content status: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while updating content status."
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error updating content status: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while updating content status."
            )
