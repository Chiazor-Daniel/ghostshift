"""
Email Utility Functions - Mailtrap Integration
"""

import os
import logging
from typing import List, Optional
from fastapi.background import BackgroundTasks
from fastapi import HTTPException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Mailtrap SDK
import mailtrap as mt

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        # Mailtrap SMTP credentials
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM", "hello@demomailtrap.co")
        
        if self.smtp_user and self.smtp_password:
            try:
                # For now, we'll use a placeholder client
                # In production, you would use smtplib or a proper email library
                logger.info("Mailtrap SMTP credentials configured")
                self.client = None  # Will use smtplib for sending
            except Exception as e:
                logger.error(f"Error initializing Mailtrap client: {e}")
                self.client = None
        else:
            logger.warning("Mailtrap SMTP credentials not set")
            self.client = None

    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html: Optional[str] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Send email using Mailtrap SMTP"""
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        if not self.smtp_user or not self.smtp_password:
            logger.warning("Mailtrap SMTP credentials not configured")
            return {"status": "skipped", "message": "Mailtrap SMTP not configured"}
        
        try:
            # Create message
            if html:
                msg = MIMEMultipart('alternative')
                msg.attach(MIMEText(body, 'plain'))
                msg.attach(MIMEText(html, 'html'))
            else:
                msg = MIMEText(body, 'plain')
            
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to
            
            # Send email via Mailtrap SMTP sandbox
            with smtplib.SMTP('sandbox.smtp.mailtrap.io', 2525) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, [to], msg.as_string())
            
            logger.info(f"Email sent to {to}")
            return {"status": "success", "message": f"Email sent to {to}"}
            
        except Exception as e:
            logger.error(f"Error sending email to {to}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    async def send_shift_scheduled(
        self,
        to: str,
        shift_title: str,
        shift_date: str,
        shift_time: str,
        location: str
    ):
        """Send shift scheduled email"""
        subject = f"Shift Scheduled: {shift_title}"
        body = f"""
        You have been scheduled for:
        
        Title: {shift_title}
        Date: {shift_date}
        Time: {shift_time}
        Location: {location}
        
        Please log in to GhostShift to confirm.
        """
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Shift Scheduled</h2>
            <p>You have been scheduled for:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                <p><strong>Title:</strong> {shift_title}</p>
                <p><strong>Date:</strong> {shift_date}</p>
                <p><strong>Time:</strong> {shift_time}</p>
                <p><strong>Location:</strong> {location}</p>
            </div>
            <p>Please log in to GhostShift to confirm your shift.</p>
        </div>
        """
        
        await self.send_email(to, subject, body, html)

    async def send_swap_request(
        self,
        to: str,
        requester_name: str,
        shift_title: str,
        shift_date: str,
        swap_details: str
    ):
        """Send swap request email"""
        subject = f"Shift Swap Request from {requester_name}"
        body = f"""
        {requester_name} wants to swap shifts with you:
        
        Their Shift: {shift_title} on {shift_date}
        
        Swap Details: {swap_details}
        
        Please log in to GhostShift to approve or reject.
        """
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Shift Swap Request</h2>
            <p>{requester_name} wants to swap shifts with you:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                <p><strong>Their Shift:</strong> {shift_title} on {shift_date}</p>
                <p><strong>Swap Details:</strong> {swap_details}</p>
            </div>
            <p>Please log in to GhostShift to approve or reject this request.</p>
        </div>
        """
        
        await self.send_email(to, subject, body, html)

    async def send_burnout_alert(
        self,
        to: str,
        employee_name: str,
        burnout_score: int,
        risk_level: str,
        recommendations: List[str]
    ):
        """Send burnout alert email"""
        subject = f"Burnout Alert: {employee_name} - Risk Level: {risk_level.upper()}"
        body = f"""
        Burnout Alert for {employee_name}
        
        Burnout Score: {burnout_score}/100
        Risk Level: {risk_level.upper()}
        
        Recommendations:
        {chr(10).join(f'- {rec}' for rec in recommendations)}
        
        Please review and take appropriate action.
        """
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: {'#dc3545' if risk_level == 'high' else '#ffc107'};">
                Burnout Alert
            </h2>
            <p><strong>Employee:</strong> {employee_name}</p>
            <p><strong>Burnout Score:</strong> {burnout_score}/100</p>
            <p><strong>Risk Level:</strong> <span style="color: {'#dc3545' if risk_level == 'high' else '#ffc107'};">{risk_level.upper()}</span></p>
            
            <h3>Recommendations:</h3>
            <ul>
                {chr(10).join(f'<li>{rec}</li>' for rec in recommendations)}
            </ul>
            
            <p>Please review and take appropriate action.</p>
        </div>
        """
        
        await self.send_email(to, subject, body, html)

    async def send_invitation(
        self,
        to: str,
        inviter_name: str,
        org_name: str,
        role: str,
        invite_url: str
    ):
        """Send invitation email"""
        subject = f"You've been invited to join {org_name}"
        body = f"""
        {inviter_name} has invited you to join {org_name} as a {role}.
        
        Click the link below to accept:
        {invite_url}
        
        This invitation expires in 7 days.
        """
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Invitation to Join</h2>
            <p>{inviter_name} has invited you to join <strong>{org_name}</strong> as a <strong>{role}</strong>.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{invite_url}" 
                   style="background: #007bff; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Accept Invitation
                </a>
            </div>
            
            <p>This invitation expires in 7 days.</p>
        </div>
        """
        
        await self.send_email(to, subject, body, html)


# Global instance
email_service = EmailService()
