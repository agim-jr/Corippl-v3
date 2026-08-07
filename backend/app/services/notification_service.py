# backend/app/services/notification_service.py

import logging
import asyncio
import threading
from sqlalchemy.orm import Session
from ..models.notification import Notification
from ..models.schemas import NotificationCreate
from ..models.user import User
from ..models.content import Content
from ..models.preference import Preference
from ..utils.email import EmailSchema, send_email
from jinja2 import Environment, FileSystemLoader
import os
from ..config import settings  # ✅ Add this line
from datetime import datetime  # Add this at the top with other imports



# ✅ ADD THIS CHECK
if not hasattr(settings, 'FRONTEND_URL') or not settings.FRONTEND_URL:
    raise ValueError("FRONTEND_URL must be configured in settings")

logger = logging.getLogger(__name__)

def get_notifications_for_user(db: Session, user_id: int):
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()

def create_notification(db: Session, notification: NotificationCreate):
    try:
        notification_data = notification.dict()  # Define it first
        # notification_data['timestamp'] = datetime.utcnow()  # ❌ REMOVE THIS LINE
        db_notification = Notification(**notification_data)  # Create once with all data
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating notification for user {notification.user_id}: {e}")
        # ✅ SOLUTION: Raise HTTPException with context instead of generic Exception
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create notification: {str(e)}"
        )

def mark_notification_as_read(db: Session, user_id: int, notification_id: int):
    try:  # ✅ ADD THIS LINE
        notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
        if notification:
            notification.is_read = True
            db.commit()
            db.refresh(notification)
            return notification
        return None
    except Exception as e:  # ✅ ADD THIS LINE
        db.rollback()  # ✅ ADD THIS LINE
        logger.error(f"Error marking notification {notification_id} as read: {e}")  # ✅ ADD THIS LINE
        return None  # ✅ ADD THIS LINE (don't raise since it returns None on failure)


def create_content_share_notification(db: Session, content: Content, sharer_user: User):
    """
    Create a notification for the content owner when someone shares their content.
    Also sends an email if the owner has email notifications enabled.
    """
    # Create in-app notification
    message = f"@{sharer_user.username} shared your content: \"{content.title}\""
    notification = NotificationCreate(
        user_id=content.user_id,
        type="content_share",
        message=message
    )

    db_notification = create_notification(db, notification)

    # Check if we should send an email
    content_owner = db.query(User).filter(User.id == content.user_id).first()
    if not content_owner:
        logger.error(f"Content owner with ID {content.user_id} not found")
        return db_notification

    # Get owner's preferences
    preferences = db.query(Preference).filter(Preference.user_id == content.user_id).first()

    # If preferences don't exist or email notifications are enabled
    should_send_email = not preferences or preferences.email_content_shared

    # Also check for milestones if enabled
    milestone_notification = False
    if preferences and preferences.email_content_shared_milestone:
        # Check if share count is a milestone number
        milestones = [5, 10, 25, 50, 100, 250, 500, 1000]
        if content.share_count in milestones or (content.share_count >= 100 and content.share_count % 100 == 0):
            milestone_notification = True

    if should_send_email or milestone_notification:
        try:
            # Set up template rendering
            template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
            env = Environment(loader=FileSystemLoader(template_dir))

            if milestone_notification:
                # Use milestone template if it exists, otherwise create it
                try:
                    template = env.get_template("content_milestone.html")
                except:
                    # Create milestone template if it doesn't exist
                    create_milestone_template(template_dir)
                    env = Environment(loader=FileSystemLoader(template_dir))
                    template = env.get_template("content_milestone.html")

                subject = f"Milestone reached! Your content has been shared {content.share_count} times"
            else:
                # Use content shared template if it exists, otherwise create it
                try:
                    template = env.get_template("content_shared.html")
                except:
                    # Create content shared template if it doesn't exist
                    create_content_shared_template(template_dir)
                    env = Environment(loader=FileSystemLoader(template_dir))
                    template = env.get_template("content_shared.html")

                subject = f"{sharer_user.username} shared your content"

            # Render the email HTML
            html_content = template.render(
                owner_name=content_owner.username,
                sharer_name=sharer_user.username,
                content=content,
                share_count=content.share_count,
                base_url=settings.FRONTEND_URL
            )

            # Create email schema
            email = EmailSchema(
                email=[content_owner.email],
                subject=f"🎉 {subject} - Corippl",
                body=html_content
            )

            # Send email asynchronously without blocking
            def run_async_email(email_data, user_id):
                """Run async email in separate thread"""
                from ..utils.email import send_email

                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                try:
                    loop.run_until_complete(send_email(email_data))
                    logger.info(f"Email sent successfully to user {user_id}")
                except Exception as e:
                    logger.error(f"Failed to send email to user {user_id}: {str(e)}")
                finally:
                    loop.close()

            # Start daemon thread - fire and forget
            email_thread = threading.Thread(
                target=run_async_email,
                args=(email, content_owner.id),
                daemon=True
            )
            email_thread.start()

            logger.info(f"Started email notification thread for user {content_owner.id}")

        except Exception as e:  # ✅ ADD THIS LINE
            logger.error(f"Error preparing content share notification email: {str(e)}")  # ✅ ADD THIS LINE

    return db_notification

def create_content_shared_template(template_dir):
    """Create the content_shared.html template if it doesn't exist"""
    template_path = os.path.join(template_dir, "content_shared.html")

    template_content = """<!DOCTYPE html>
<html>
<head>
    <title>Your content was shared</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .content-card { border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .content-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
        .content-description { color: #555; margin-bottom: 15px; }
        .stats { background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <p>Hello {{ owner_name }},</p>

    <p>Great news! <strong>{{ sharer_name }}</strong> just shared your content:</p>

    <div class="content-card">
        <div class="content-title">{{ content.title }}</div>
        <div class="content-description">{{ content.description }}</div>
    </div>

    <div class="stats">
        <p>Current share count: <strong>{{ share_count }}</strong></p>
    </div>

    <p>Keep creating great content!</p>

    <div class="footer">
        <p>To manage your email preferences, visit your account settings in Corippl.</p>
        <p>This email was sent because you have enabled content share notifications.</p>
    </div>
</body>
</html>"""

    # Create the file if it doesn't exist
    if not os.path.exists(template_path):
        with open(template_path, 'w') as f:
            f.write(template_content)
        logger.info(f"Created content_shared.html template at {template_path}")

def create_milestone_template(template_dir):
    """Create the content_milestone.html template if it doesn't exist"""
    template_path = os.path.join(template_dir, "content_milestone.html")

    template_content = """<!DOCTYPE html>
<html>
<head>
    <title>Content Milestone Reached!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .content-card { border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .content-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
        .milestone { font-size: 24px; color: #4CAF50; margin: 20px 0; text-align: center; }
        .stats { background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <p>Hello {{ owner_name }},</p>

    <div class="milestone">
        🎉 Congratulations! Your content has been shared {{ share_count }} times! 🎉
    </div>

    <p>Your content is resonating with people:</p>

    <div class="content-card">
        <div class="content-title">{{ content.title }}</div>
        <div class="content-description">{{ content.description }}</div>
    </div>

    <div class="stats">
        <p>Current total shares: <strong>{{ share_count }}</strong></p>
        <p>Most recent share by: <strong>{{ sharer_name }}</strong></p>
    </div>

    <p>Keep up the great work! The more engaging your content is, the more it will be shared.</p>

    <div class="footer">
        <p>To manage your email preferences, visit your account settings in Corippl.</p>
        <p>This email was sent because you have enabled milestone notifications.</p>
    </div>
</body>
</html>"""

    # Create the file if it doesn't exist
    if not os.path.exists(template_path):
        with open(template_path, 'w') as f:
            f.write(template_content)
        logger.info(f"Created content_milestone.html template at {template_path}")

def create_shuffle_reset_notification(db: Session, user: User, new_shuffle_count: int):
    """
    Create a notification when a user's shuffles are automatically reset.
    Also sends an email if the user has email notifications enabled.
    """
    try:
        # Create in-app notification
        message = f"🔄 Your shuffles have been reset! You now have {new_shuffle_count} shuffles available."
        notification = NotificationCreate(
            user_id=user.id,
            type="shuffle_reset",
            message=message
        )

        db_notification = create_notification(db, notification)

        # Check if we should send an email (default to user's email_notifications setting)
        should_send_email = user.email_notifications if user.email_notifications is not None else False

        if should_send_email:
            try:
                # Set up template rendering
                template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")

                # Create template directory if it doesn't exist
                os.makedirs(template_dir, exist_ok=True)

                env = Environment(loader=FileSystemLoader(template_dir))

                # Try to get the shuffle reset template, create if doesn't exist
                try:
                    template = env.get_template("shuffle_reset.html")
                except:
                    create_shuffle_reset_template(template_dir)
                    env = Environment(loader=FileSystemLoader(template_dir))
                    template = env.get_template("shuffle_reset.html")

                # Render the email HTML
                html_content = template.render(
                    username=user.username,
                    shuffle_count=new_shuffle_count,
                    base_url=settings.FRONTEND_URL
                )

                # Create email schema
                email = EmailSchema(
                    email=[user.email],
                    subject=f"🔄 Your Shuffles Have Been Reset - Corippl",
                    body=html_content
                )

                # Send email in a separate thread
                def run_async_email(email_data):
                    from ..utils.email import send_email

                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                    try:
                        loop.run_until_complete(send_email(email_data))
                        logger.info(f"Shuffle reset notification email sent to {user.email}")
                    except Exception as e:
                        logger.error(f"Failed to send shuffle reset email: {str(e)}")
                    finally:
                        loop.close()

                # ✅ FIXED VERSION
                email_thread = threading.Thread(
                target=run_async_email,
                args=(email,),
                daemon=True  # ✅ ADD THIS LINE
                )
                email_thread.start()

                logger.info(f"Started shuffle reset email notification thread for user {user.id}")

            except Exception as e:
                logger.error(f"Error preparing shuffle reset notification email: {str(e)}")

        return db_notification

    except Exception as e:
        logger.error(f"Error creating shuffle reset notification for user {user.id}: {e}")
        db.rollback()
        return None


def create_shuffle_reset_template(template_dir):
    """Create the shuffle_reset.html email template if it doesn't exist"""
    template_path = os.path.join(template_dir, "shuffle_reset.html")

    template_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shuffles Reset - Corippl</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header .emoji {
            font-size: 48px;
            margin-bottom: 10px;
            display: block;
        }
        .content {
            padding: 30px;
        }
        .shuffle-count {
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
            border-left: 4px solid #8b5cf6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            text-align: center;
        }
        .shuffle-count strong {
            color: #6b21a8;
            font-size: 36px;
            display: block;
            margin: 10px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #000000 0%, #333333 100%);
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .info-box {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="emoji">🔄</span>
            <h1>Shuffles Reset!</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{{ username }}</strong>,</p>

            <p>Good news! Your shuffle counter has been automatically reset.</p>

            <div class="shuffle-count">
                You now have
                <strong>{{ shuffle_count }}</strong>
                shuffles available!
            </div>

            <div class="info-box">
                <h4 style="margin: 0 0 10px 0; color: #1e40af;">💡 What are shuffles?</h4>
                <p style="margin: 0; color: #374151;">
                    Shuffles let you discover fresh content from the community. Use them wisely to find and share amazing content!
                </p>
            </div>

            <div style="text-align: center;">
                <a href="{{ base_url }}/home" class="cta-button">
                    Start Shuffling Now →
                </a>
            </div>

            <p style="margin-top: 30px;">
                <strong>Pro Tip:</strong> Shuffles reset every 12 hours, so make sure to use them regularly to discover the best content!
            </p>
        </div>

        <div class="footer">
            <p>You're receiving this email because you have email notifications enabled.</p>
            <p>To manage your email preferences, visit your <a href="{{ base_url }}/home" style="color: #000000; text-decoration: none; font-weight: bold;">account settings</a>.</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 12px;">&copy; 2025 Corippl. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""

    # Create the file
    with open(template_path, 'w') as f:
        f.write(template_content)
    logger.info(f"Created shuffle_reset.html template at {template_path}")
