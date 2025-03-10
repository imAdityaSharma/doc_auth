import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime, timedelta
import logging

class EmailServer:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = 'xxxxxxxxxxxxxxxxxx@gmail.com'
        self.sender_password = 'xxxxxxxxxxxxxx'
        
        # Add validation
        if not self.sender_email or not self.sender_password:
            logging.error("Email credentials not found in environment variables")
            raise ValueError("EMAIL_ADDRESS and EMAIL_PASSWORD environment variables are required")
        
        # Test connection during initialization
        self.test_connection()

    def test_connection(self):
        """Test SMTP connection and credentials"""
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                logging.info("SMTP connection test successful")
        except Exception as e:
            logging.error(f"SMTP connection test failed: {str(e)}")
            raise ConnectionError(f"Failed to connect to SMTP server: {str(e)}")

    def send_verification_email(self, recipient_email, verification_token, msg):
        # Log attempt
        logging.info(f"Attempting to send verification email to {recipient_email}")
        
        # Validate inputs
        if not recipient_email or not verification_token:
            raise ValueError("Recipient email and verification token are required")

        message = MIMEMultipart()
        message["From"] = f"MaxRay Healthcare <{self.sender_email}>"
        message["To"] = recipient_email

        if msg == "forgot_password":
            message["Subject"] = "Password Reset Request - MaxRay Healthcare"
            # HTML version of the email
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                        <h2 style="color: #333;">Password Reset Request</h2>
                        <p>We received a request to reset your password for your MaxRay Healthcare account.</p>
                        <p>Your verification code is:</p>
                        <div style="background-color: #eee; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                            {verification_token}
                        </div>
                        <p>This code will expire in 15 minutes.</p>
                        <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">Best regards,<br>MaxRay Healthcare Team</p>
                    </div>
                </body>
            </html>
            """
            # Plain text version of the email
            text_body = f"""
            Password Reset Request

            We received a request to reset your password for your MaxRay Healthcare account.
            Your verification code is: {verification_token}

            This code will expire in 15 minutes.

            If you did not request this, please ignore this email.

            Best regards,
            MaxRay Healthcare Team
            """
        elif msg == "changepassword":
            message["Subject"] = "Change Password Verification - MaxRay Healthcare"
            # HTML version of the email
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                        <h2 style="color: #333;">Change Password Verification</h2>
                        <p>Thank you for choosing MaxRay Healthcare. To change your password, please use the following verification code:</p>
                        <div style="background-color: #eee; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                            {verification_token}
                        </div>
                        <p>This code will expire in 30 minutes.</p>
                        <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">Best regards,<br>MaxRay Healthcare Team</p>
                    </div>
                </body>
            </html>
            """
            # Plain text version of the email
            text_body = f"""
            Change Password Verification

            Thank you for choosing MaxRay Healthcare. To change your password, please use the following verification code:
            {verification_token}

            This code will expire in 30 minutes.

            If you did not request this, please ignore this email.

            Best regards,
            MaxRay Healthcare Team
            """
        elif msg == "new_user":
            message["Subject"] = "Email Verification - MaxRay Healthcare"

            # HTML version of the email
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                        <h2 style="color: #333;">Email Verification</h2>
                        <p>Thank you for registering with MaxRay Healthcare.</p>
                        <p>Your verification code is:</p>
                        <div style="background-color: #eee; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                            {verification_token}
                        </div>
                        <p>This code will expire in 30 minutes.</p>
                        <p style="color: #666; font-size: 12px;">If you did not request this verification, please ignore this email.</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">Best regards,<br>MaxRay Healthcare Team</p>
                    </div>
                </body>
            </html>
            """

            # Plain text version of the email
            text_body = f"""
            Email Verification

            Thank you for registering with MaxRay Healthcare. 
            Your verification code is: {verification_token}

            This code will expire in 30 minutes.

            If you did not request this verification, please ignore this email.

            Best regards,
            MaxRay Healthcare Team
            """

        # Attach both versions
        message.attach(MIMEText(text_body, "plain"))
        message.attach(MIMEText(html_body, "html"))

        # Detailed logging for SMTP connection
        logging.info("Establishing SMTP connection")
        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            logging.info("Starting TLS")
            server.starttls()
            
            logging.info("Attempting login")
            server.login(self.sender_email, self.sender_password)
            
            logging.info("Sending email")
            server.send_message(message)
            
            logging.info(f"Verification email sent successfully to {recipient_email}")
            return True


