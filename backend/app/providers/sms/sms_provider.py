# backend/app/providers/sms/sms_provider.py

import africastalking

from app.config.settings import settings
from app.providers.base import NotificationProvider


africastalking.initialize(
    settings.AFRICASTALKING_USERNAME,
    settings.AFRICASTALKING_API_KEY,
)

sms = africastalking.SMS


class SMSProvider(NotificationProvider):

    def send(
        self,
        *,
        recipient: str,
        subject: str,
        body: str,
    ) -> dict:

        try:

            response = sms.send(
                body,
                [recipient],
                sender_id=settings.AFRICASTALKING_SENDER_ID or None,
            )

            return {
                "success": True,
                "status": "sent",
                "provider_message_id": response,
                "status_code": 201,
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