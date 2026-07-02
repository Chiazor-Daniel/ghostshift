"""
Test Mailtrap Email Integration
"""

import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.email import email_service


async def test_email():
    """Test sending an email with Resend"""
    print("Testing Resend Email Integration...")
    print("=" * 50)
    
    # Check if Resend is configured
    if not os.getenv("RESEND_API_KEY"):
        print("❌ Resend API key not configured")
        print("Please check your .env file and ensure RESEND_API_KEY is set")
        return
    
    # Test email (Must be the email you registered on Resend with if domain is unverified)
    to = "chiazordaniel317@gmail.com"
    subject = "Test Email from GhostShift"
    body = "This is a test email to verify Resend integration is working!"
    html = """
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Test Email</h2>
        <p>This is a test email to verify Resend integration is working!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Status:</strong> Success</p>
            <p><strong>Recipient:</strong> chiazordaniel317@gmail.com</p>
        </div>
        <p>If you see this email, your Resend API integration is working perfectly! 🎉</p>
    </div>
    """
    
    try:
        result = await email_service.send_email(to, subject, body, html)
        print(f"✅ Email sent successfully!")
        print(f"Result: {result}")
    except Exception as e:
        print(f"❌ Error sending email: {e}")


if __name__ == "__main__":
    asyncio.run(test_email())
