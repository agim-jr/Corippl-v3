# backend/app/utils/email.py

import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import BaseModel, EmailStr
from typing import List
from ..config import settings
import requests
import httpx
from fastapi import HTTPException
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Initialize logger
logger = logging.getLogger(__name__)

class EmailSchema(BaseModel):
    email: List[EmailStr]
    subject: str
    body: str

    class Config:
        from_attributes = True

# Keep the original config in case other parts of your code refer to it
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_email(email: EmailSchema):
    """
    Send email using direct SMTP to SendGrid instead of their API
    """
    try:
        logger.info(f"📧 Attempting to send email to: {email.email}")
        logger.info(f"📧 Subject: {email.subject}")
        logger.info(f"📧 SMTP Server: {settings.MAIL_SERVER}:{settings.MAIL_PORT}")
        logger.info(f"📧 From: {settings.MAIL_FROM}")

        # Create message
        message = MIMEMultipart()
        message["From"] = f"Corippl <{settings.MAIL_FROM}>"
        message["To"] = ", ".join(email.email)
        message["Subject"] = email.subject
        message.attach(MIMEText(email.body, "html"))

        # Connect to SendGrid SMTP server
        logger.info("🔌 Connecting to SendGrid SMTP...")
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10) as server:
            server.set_debuglevel(1)

            logger.info("🔒 Starting TLS...")
            server.starttls()

            logger.info("🔑 Authenticating with SendGrid...")
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)

            logger.info("📨 Sending message...")
            server.send_message(message)

            logger.info(f"✅ Email sent successfully to {', '.join(email.email)}")
            print(f"✅ SMTP: Email sent successfully to {email.email}")
            return {"success": True}

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ SMTP Authentication failed: {str(e)}")
        print(f"❌ Authentication Error: Check your SendGrid API key")
        raise HTTPException(
            status_code=500,
            detail="Email authentication failed. Please contact support."
        )
    except smtplib.SMTPException as e:
        logger.error(f"❌ SMTP Error: {str(e)}")
        print(f"❌ SMTP Exception: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send email. Please try again later."
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error sending email: {str(e)}")
        logger.exception("Full traceback:")
        print(f"❌ Exception: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while sending email."
        )

async def send_email_api(email: EmailSchema):
    """
    Send email using SendGrid API directly instead of SMTP
    """
    try:
        url = "https://api.sendgrid.com/v3/mail/send"

        data = {
            "personalizations": [
                {
                    "to": [{"email": recipient} for recipient in email.email]
                }
            ],
            "from": {
                "email": settings.MAIL_FROM,
                "name": "Corippl Support"
            },
            "subject": email.subject,
            "content": [
                {
                    "type": "text/html",
                    "value": email.body
                }
            ]
        }

        logger.debug(f"Sending email via SendGrid API to {len(email.email)} recipients")
        logger.debug(f"Subject: {email.subject}")
        headers = {
            "Authorization": f"Bearer {settings.MAIL_PASSWORD}",
            "Content-Type": "application/json"
        }

        logger.debug(f"Sending email to {', '.join(email.email)} via SendGrid API")

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
            response_text = response.text

            print(f"SendGrid API response status: {response.status_code}")
            print(f"SendGrid API response text: {response_text}")

            if response.status_code >= 200 and response.status_code < 300:
                logger.info(f"Email sent successfully to {', '.join(email.email)}")
                return {"success": True}
            else:
                logger.error(f"SendGrid API error: {response.status_code} - {response_text}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to send email. Please try again later."
                )

    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        print(f"Exception in send_email: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while sending email."
        )


async def send_ai_autopilot_notification(
    user_email: str,
    user_name: str,
    unlocked_content_title: str,
    unlocked_content_id: int,
    shares_performed: int
):
    """
    Send email notification when AI autopilot unlocks content.
    """
    try:
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border: 2px solid #000; }}
        .header {{ background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .emoji {{ font-size: 48px; margin-bottom: 10px; }}
        .content {{ padding: 30px; }}
        .unlock-box {{ background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }}
        .stats {{ display: flex; justify-content: space-around; margin: 20px 0; }}
        .stat-item {{ text-align: center; }}
        .stat-number {{ font-size: 32px; font-weight: bold; color: #8b5cf6; }}
        .cta-button {{ display: inline-block; background: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🤖</div>
            <h1>AI Autopilot Success!</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{user_name}</strong>,</p>

            <p>Great news! Your AI autopilot just unlocked new content for you:</p>

            <div class="unlock-box">
                <h3 style="margin: 0 0 10px 0;">✨ "{unlocked_content_title}"</h3>
                <p style="margin: 0; color: #374151;">
                    This content is now fully unlocked and ready to share with your audience!
                </p>
            </div>

            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number">{shares_performed}</div>
                    <div>Automated Shares</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">1</div>
                    <div>Content Unlocked</div>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="{settings.FRONTEND_URL}/home" class="cta-button">
                    View Your Content →
                </a>
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #f0fdf4; border-radius: 8px;">
                <p style="margin: 0; color: #166534;">
                    <strong>💡 Pro Tip:</strong> Your AI is actively maintaining reciprocal balance.
                    Check your AI Dashboard to see all automated activity!
                </p>
            </div>
        </div>

        <div class="footer">
            <p>You're receiving this because you have AI autopilot enabled.</p>
            <p>Manage your AI settings in your <a href="{settings.FRONTEND_URL}/home" style="color: #000; font-weight: bold;">dashboard</a>.</p>
        </div>
    </div>
</body>
</html>
        """

        email = EmailSchema(
            email=[user_email],
            subject=f"🤖 AI Unlocked: {unlocked_content_title} - Corippl",
            body=html_content
        )

        await send_email(email)
        logger.info(f"AI autopilot notification sent to {user_email}")

    except Exception as e:
        logger.error(f"Failed to send AI autopilot notification: {str(e)}")


async def send_share_notification_email(
    recipient_email: str,
    sharer_name: str,
    content_title: str
):
    """
    Send email notification when someone shares content with a contact.
    """
    try:
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border: 2px solid #000; }}
        .header {{ background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .emoji {{ font-size: 48px; margin-bottom: 10px; }}
        .content {{ padding: 30px; }}
        .share-box {{ background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }}
        .cta-button {{ display: inline-block; background: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🎁</div>
            <h1>{sharer_name} shared something with you!</h1>
        </div>

        <div class="content">
            <p>Hi there,</p>

            <p><strong>{sharer_name}</strong> thought you'd be interested in this content:</p>

            <div class="share-box">
                <h3 style="margin: 0 0 10px 0;">📚 {content_title}</h3>
                <p style="margin: 0; color: #374151;">
                    Check out this content shared through Corippl's reciprocal sharing network.
                </p>
            </div>

            <div style="text-align: center;">
                <a href="{settings.FRONTEND_URL}" class="cta-button">
                    View Content →
                </a>
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; color: #92400e;">
                    <strong>💡 New to Corippl?</strong> Join our reciprocal sharing network where creators help each other grow their audience!
                </p>
            </div>
        </div>

        <div class="footer">
            <p>You received this because {sharer_name} added you as a contact.</p>
            <p><a href="{settings.FRONTEND_URL}" style="color: #000; font-weight: bold;">Learn more about Corippl</a></p>
        </div>
    </div>
</body>
</html>
        """

        email = EmailSchema(
            email=[recipient_email],
            subject=f"{sharer_name} shared: {content_title} - Corippl",
            body=html_content
        )

        await send_email(email)
        logger.info(f"Share notification sent to {recipient_email}")

    except Exception as e:
        logger.error(f"Failed to send share notification: {str(e)}")
        raise


async def subscribe_to_mailchimp(email: str):
    url = f"https://{settings.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/{settings.MAILCHIMP_LIST_ID}/members"
    data = {
        "email_address": email,
        "status": "subscribed"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(
            url,
            auth=("anystring", settings.MAILCHIMP_API_KEY),
            json=data,
            headers=headers
        )
        logger.info(f"Mailchimp response status: {response.status_code}")
        logger.info(f"Mailchimp response body: {response.text}")

        if response.status_code in [200, 201]:
            logger.info(f"Subscribed {email} to MailChimp successfully.")
            return response.json()
        elif response.status_code == 400 and "Member Exists" in response.text:
            logger.warning(f"Email {email} already exists in MailChimp list.")
            raise HTTPException(
                status_code=400,
                detail="This email is already subscribed to the waitlist."
            )
        else:
            try:
                error_detail = response.json().get("detail", response.text)
            except ValueError:
                error_detail = response.text
            logger.error(f"Failed to subscribe {email} to MailChimp: {error_detail}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to subscribe to MailChimp: {error_detail}"
            )
    except requests.exceptions.RequestException as e:
        logger.error(f"MailChimp request error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to connect to MailChimp. Please try again later."
        )
