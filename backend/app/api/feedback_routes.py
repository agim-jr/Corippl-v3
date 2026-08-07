# backend/app/api/feedback_routes.py

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import asyncio

from ..database import get_db
from ..models.schemas import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackListResponse,
    FeedbackStatusUpdate
)
from ..models.feedback import Feedback
from ..utils.email import send_email, EmailSchema
from ..config import settings
from ..utils.dependencies import get_current_user
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"]
)


# ✅ NEW: Synchronous wrapper for background email sending
def send_emails_for_feedback(
    name: str,
    email: str,
    subject: str,
    message: str,
    feedback_type: str
):
    """
    Synchronous wrapper to send both business and user emails.
    Called as a background task by FastAPI.
    """
    async def _send():
        try:
            logger.info(f"📧 Starting email send for feedback: {subject}")

            # Send business notification
            await send_business_notification(name, email, subject, message, feedback_type)
            logger.info(f"✅ Business notification sent for: {subject}")

            # Send user confirmation
            await send_user_confirmation(email, name)
            logger.info(f"✅ User confirmation sent to: {email}")

            logger.info(f"✅ All feedback emails sent successfully for: {subject}")

        except Exception as e:
            logger.error(f"❌ Failed to send feedback emails: {str(e)}", exc_info=True)

    # Run async functions in new event loop
    try:
        asyncio.run(_send())
    except Exception as e:
        logger.error(f"❌ Error in asyncio.run: {str(e)}", exc_info=True)


# ✅ FIXED: Changed to synchronous function with BackgroundTasks
@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    feedback: FeedbackCreate,
    background_tasks: BackgroundTasks,  # ✅ Added this parameter
    db: Session = Depends(get_db)
):
    """
    Public endpoint for users to submit feedback/contact form.
    No authentication required - accessible from landing page.
    """
    try:
        # Create feedback record (synchronous database operation)
        db_feedback = Feedback(
            name=feedback.name,
            email=feedback.email,
            subject=feedback.subject,
            message=feedback.message,
            feedback_type=feedback.feedback_type,
            status="new"
        )

        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)

        logger.info(f"📝 Feedback saved to DB: ID={db_feedback.id}, Subject='{feedback.subject}', From='{feedback.email}'")

        # ✅ Queue email sending in background (non-blocking)
        background_tasks.add_task(
            send_emails_for_feedback,
            name=feedback.name,
            email=feedback.email,
            subject=feedback.subject,
            message=feedback.message,
            feedback_type=feedback.feedback_type
        )

        logger.info(f"🚀 Background email task queued for: {feedback.email}")

        # Return immediately without waiting for emails
        return db_feedback

    except Exception as e:
        logger.error(f"❌ Error submitting feedback: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback. Please try again later."
        )


@router.get("/admin", response_model=FeedbackListResponse)
def get_all_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, regex="^(new|in_progress|resolved)$"),
    type_filter: Optional[str] = Query(None, regex="^(general|support|bug|feature|business)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin endpoint to view all feedback submissions.
    Requires authentication and admin privileges.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    query = db.query(Feedback)

    if status_filter:
        query = query.filter(Feedback.status == status_filter)

    if type_filter:
        query = query.filter(Feedback.feedback_type == type_filter)

    total = query.count()
    feedback_list = query.order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "feedback": feedback_list,
        "total": total
    }


@router.patch("/admin/{feedback_id}/status", response_model=FeedbackResponse)
def update_feedback_status(
    feedback_id: int,
    status_update: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin endpoint to update feedback status.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    feedback.status = status_update.status
    db.commit()
    db.refresh(feedback)

    logger.info(f"✏️ Feedback {feedback_id} status → {status_update.status} (by admin {current_user.id})")

    return feedback


# ✅ Email helper functions (unchanged, but added logging)
async def send_business_notification(
    name: str,
    email: str,
    subject: str,
    message: str,
    feedback_type: str
):
    """Send notification to business email (junior@corippl.com)"""

    logger.info(f"📧 Preparing business notification email to junior@corippl.com...")

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border: 2px solid #000; }}
        .header {{ background: #000; color: white; padding: 30px; text-align: center; }}
        .content {{ padding: 30px; }}
        .info-box {{ background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }}
        .label {{ font-weight: bold; color: #374151; }}
        .value {{ color: #1f2937; margin-bottom: 15px; }}
        .message-box {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }}
        .type-badge {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }}
        .type-general {{ background: #e5e7eb; color: #374151; }}
        .type-support {{ background: #dbeafe; color: #1e40af; }}
        .type-bug {{ background: #fee2e2; color: #991b1b; }}
        .type-feature {{ background: #d1fae5; color: #065f46; }}
        .type-business {{ background: #fef3c7; color: #92400e; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Contact Form Submission</h1>
        </div>

        <div class="content">
            <div style="text-align: center; margin-bottom: 20px;">
                <span class="type-badge type-{feedback_type}">{feedback_type}</span>
            </div>

            <div class="info-box">
                <div class="value">
                    <span class="label">From:</span> {name}
                </div>
                <div class="value">
                    <span class="label">Email:</span> <a href="mailto:{email}">{email}</a>
                </div>
                <div class="value">
                    <span class="label">Subject:</span> {subject}
                </div>
            </div>

            <div class="message-box">
                <p class="label" style="margin-bottom: 10px;">Message:</p>
                <p style="white-space: pre-wrap;">{message}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="mailto:{email}?subject=Re: {subject}"
                   style="display: inline-block; background: #000; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Reply to {name}
                </a>
            </div>
        </div>

        <div class="footer">
            <p>This message was sent from your Corippl contact form.</p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
                View all feedback at: {settings.FRONTEND_URL}/admin/feedback
            </p>
        </div>
    </div>
</body>
</html>
    """

    email_data = EmailSchema(
        email=["junior@corippl.com"],
        subject=f"[Corippl Contact] {feedback_type.upper()}: {subject}",
        body=html_content
    )

    try:
        await send_email(email_data)
        logger.info(f"✅ Business notification sent successfully to junior@corippl.com")
    except Exception as e:
        logger.error(f"❌ Failed to send business notification: {str(e)}", exc_info=True)
        raise


async def send_user_confirmation(user_email: str, user_name: str):
    """Send confirmation email to user who submitted feedback"""

    logger.info(f"📧 Preparing user confirmation email for {user_email}...")

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border: 2px solid #000; }}
        .header {{ background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; }}
        .content {{ padding: 30px; }}
        .checkmark {{ font-size: 48px; margin-bottom: 10px; }}
        .info-card {{ background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; }}
        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="checkmark">✓</div>
            <h1>Message Received!</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{user_name}</strong>,</p>

            <p>Thank you for reaching out to Corippl! We've received your message and will get back to you as soon as possible.</p>

            <div class="info-card">
                <p style="margin: 0; color: #1e40af; font-weight: bold;">
                    ⏱️ Response Time
                </p>
                <p style="margin: 5px 0 0 0; color: #374151;">
                    Our team typically responds within 24-48 hours during business days.
                </p>
            </div>

            <p><strong>In the meantime:</strong></p>
            <ul style="color: #374151;">
                <li>Check out our <a href="{settings.FRONTEND_URL}/pricing" style="color: #2563eb; font-weight: bold;">pricing plans</a></li>
                <li>Explore <a href="{settings.FRONTEND_URL}" style="color: #2563eb; font-weight: bold;">platform features</a></li>
                <li>Read our <a href="{settings.FRONTEND_URL}/about" style="color: #2563eb; font-weight: bold;">about page</a></li>
            </ul>

            <p style="margin-top: 30px;">Best regards,<br><strong>The Corippl Team</strong></p>
        </div>

        <div class="footer">
            <p>If you didn't submit this form, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
    """

    email_data = EmailSchema(
        email=[user_email],
        subject="We received your message - Corippl",
        body=html_content
    )

    try:
        await send_email(email_data)
        logger.info(f"✅ User confirmation sent successfully to {user_email}")
    except Exception as e:
        logger.error(f"❌ Failed to send user confirmation: {str(e)}", exc_info=True)
        raise
