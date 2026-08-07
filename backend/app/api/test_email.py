# backend/app/api/test_email.py

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from ..utils.email import send_email, EmailSchema

router = APIRouter(
    prefix="/test",
    tags=["Test"]
)

@router.post("/send-test-email-debug", status_code=status.HTTP_200_OK)
async def send_test_email_debug():
    try:
        # Test more direct SMTP implementation without all the abstraction
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from ..config import settings

        # Create message
        message = MIMEMultipart()
        message["From"] = f"Corippl Support <{settings.MAIL_FROM}>"
        message["To"] = "Pixelsalemen@gmail.com"
        message["Subject"] = "SMTP Direct Test"
        message.attach(MIMEText("<p>This is a direct SMTP test.</p>", "html"))

        # Connect to SendGrid SMTP server
        smtp = smtplib.SMTP("smtp.sendgrid.net", 587)
        smtp.set_debuglevel(1)  # Enable verbose debug output
        smtp.starttls()
        smtp.login("apikey", settings.MAIL_PASSWORD)
        smtp.send_message(message)
        smtp.quit()

        return {"message": "Direct SMTP test completed", "success": True}
    except Exception as e:
        return {"error": str(e), "type": str(type(e))}
