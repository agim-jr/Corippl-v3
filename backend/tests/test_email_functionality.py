import asyncio
import sys
import os
from datetime import datetime

# Add the parent directory to Python path so we can import our app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.email import send_email, EmailSchema

async def test_email():
    """Test if your SendGrid email configuration works"""
    print("🧪 Testing email functionality...")

    # Replace with YOUR actual email address
    test_email = EmailSchema(
        email=["junior.agim@gmail.com"],  # ⚠️ CHANGE THIS TO YOUR EMAIL
        subject="🧪 Corippl Sharing System Test",
        body=f"""
        <html>
        <body>
            <h2>✅ Email System Test Successful!</h2>
            <p>Your Corippl sharing functionality is working correctly.</p>
            <p><strong>Test Time:</strong> {datetime.now()}</p>
            <p><strong>From:</strong> Corippl Platform</p>
            <hr>
            <p><em>This is an automated test of your content sharing email system.</em></p>
        </body>
        </html>
        """
    )

    try:
        result = await send_email(test_email)
        print("✅ SUCCESS: Email sent successfully!")
        print("📧 Check your inbox for the test email")
        return True
    except Exception as e:
        print(f"❌ FAILED: Email could not be sent")
        print(f"💡 Error details: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(test_email())
