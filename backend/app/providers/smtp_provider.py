# backend/app/providers/smtp_provider.py

import smtplib

from email.message import EmailMessage

from app.models.provider import Provider
from app.providers.base import NotificationProvider


class SMTPProvider(NotificationProvider):

    def __init__(
        self,
        provider: Provider,
    ):
        self.provider = provider

    def send(
        self,
        *,
        recipient: str,
        subject: str,
        body: str,
    ) -> dict:

        try:

            message = EmailMessage()

            message["Subject"] = subject

            message["From"] = (
                f"{self.provider.from_name} "
                f"<{self.provider.from_email}>"
            )

            message["To"] = recipient

            message.set_content(body)

            if self.provider.use_ssl:

                smtp = smtplib.SMTP_SSL(
                    self.provider.smtp_host,
                    self.provider.smtp_port,
                )

            else:

                smtp = smtplib.SMTP(
                    self.provider.smtp_host,
                    self.provider.smtp_port,
                )

                if self.provider.use_tls:
                    smtp.starttls()

            smtp.login(
                self.provider.smtp_username,
                self.provider.smtp_password,
            )

            smtp.send_message(message)

            smtp.quit()

            return {
                "success": True,
                "status": "sent",
                "provider_message_id": None,
                "status_code": 200,
                "error": None,
            }

        except Exception as exc:

            return {
                "success": False,
                "status": "failed",
                "provider_message_id": None,
                "status_code": None,
                "error": str(exc),
            }