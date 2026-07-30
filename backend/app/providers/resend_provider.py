# backend/app/providers/resend_provider.py

import resend

from app.config.settings import settings
from app.providers.base import NotificationProvider


class ResendProvider(NotificationProvider):
    def __init__(self):
        resend.api_key = settings.RESEND_API_KEY

    def send(
        self,
        *,
        recipient: str,
        subject: str,
        body: str,
    ) -> dict:

        try:
            response = resend.Emails.send(
                {
                    "from": f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>",
                    "to": recipient,
                    "subject": subject,
                    "html": f"<p>{body}</p>",
                }
            )

            return {
                "success": True,
                "status": "sent",
                "provider_message_id": response.get("id"),
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