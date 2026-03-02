"""
Email service for sending contact form submissions
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP"""
    
    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('SMTP_FROM_EMAIL', self.smtp_user)
        self.to_email = os.getenv('CONTACT_EMAIL', 'info@connectevents.co')
        
    def send_contact_form_email(
        self,
        name: str,
        email: str,
        subject: str,
        message: str
    ) -> bool:
        """
        Send a contact form submission via email
        
        Args:
            name: Sender's name
            email: Sender's email
            subject: Email subject
            message: Email message
        
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Check if SMTP is configured
            if not self.smtp_user or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Skipping email send.")
                return False
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"Contact Form: {subject}"
            msg['From'] = self.from_email
            msg['To'] = self.to_email
            msg['Reply-To'] = email
            
            # Create plain text and HTML versions
            text_content = f"""
New Contact Form Submission

From: {name}
Email: {email}
Subject: {subject}

Message:
{message}

---
This message was sent via the Beats on the Beltline contact form.
"""
            
            html_content = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }}
        .field {{ margin-bottom: 15px; }}
        .label {{ font-weight: bold; color: #555; }}
        .value {{ margin-top: 5px; padding: 10px; background: white; border-left: 3px solid #667eea; }}
        .message-box {{ background: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px; margin-top: 10px; }}
        .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">New Contact Form Submission</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">From:</div>
                <div class="value">{name}</div>
            </div>
            <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:{email}">{email}</a></div>
            </div>
            <div class="field">
                <div class="label">Subject:</div>
                <div class="value">{subject}</div>
            </div>
            <div class="field">
                <div class="label">Message:</div>
                <div class="message-box">{message.replace(chr(10), '<br>')}</div>
            </div>
            <div class="footer">
                This message was sent via the Beats on the Beltline contact form at connectevents.co
            </div>
        </div>
    </div>
</body>
</html>
"""
            
            # Attach both versions
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Contact form email sent successfully from {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send contact form email: {e}")
            return False
    
    def send_sponsor_inquiry_notification(self, name: str, email: str, phone: str, company: str, product_industry: str) -> bool:
        """
        Send email notification for sponsor inquiry submission
        
        Args:
            name: Sponsor contact name
            email: Sponsor email
            phone: Sponsor phone
            company: Company name
            product_industry: Product/Industry description
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            if not self.smtp_user or not self.smtp_password:
                logger.warning("SMTP not configured - skipping sponsor inquiry email")
                return False
            
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = self.to_email
            msg['Subject'] = f"🎯 New Sponsor Inquiry from {company}"
            
            # Plain text version
            text_content = f"""
New Sponsor Inquiry Submission

Name: {name}
Company: {company}
Email: {email}
Phone: {phone}

Product/Industry:
{product_industry}

This inquiry was submitted via the Sponsor Inquiries form at connectevents.co/sponsor-inquiries
"""
            
            # HTML version
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #FEB95F 0%, #F81889 50%, #8C52FF 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .field {{ margin-bottom: 20px; }}
        .label {{ font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .value {{ margin-top: 5px; font-size: 16px; color: #333; }}
        .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎯 New Sponsor Inquiry</h1>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">Name</div>
                <div class="value">{name}</div>
            </div>
            <div class="field">
                <div class="label">Company</div>
                <div class="value">{company}</div>
            </div>
            <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:{email}">{email}</a></div>
            </div>
            <div class="field">
                <div class="label">Phone</div>
                <div class="value"><a href="tel:{phone}">{phone}</a></div>
            </div>
            <div class="field">
                <div class="label">Product/Industry</div>
                <div class="value">{product_industry}</div>
            </div>
            <div class="footer">
                This inquiry was submitted via the Sponsor Inquiries form at connectevents.co/sponsor-inquiries
            </div>
        </div>
    </div>
</body>
</html>
"""
            
            # Attach both versions
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Sponsor inquiry notification sent successfully for {company}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send sponsor inquiry notification: {e}")
            return False
    
    def test_connection(self) -> bool:
        """
        Test SMTP connection
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            if not self.smtp_user or not self.smtp_password:
                logger.warning("SMTP credentials not configured")
                return False
                
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
            
            logger.info("SMTP connection test successful")
            return True
            
        except Exception as e:
            logger.error(f"SMTP connection test failed: {e}")
            return False
