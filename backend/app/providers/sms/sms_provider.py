# backend/app/providers/sms/sms_provider.py

import requests

class _NoSSLVerifySession(requests.Session):
    trust_env = False
    verify = False

requests.Session = _NoSSLVerifySession

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

            provider_message_id = self._extract_message_id(response)

            return {
                "success": True,
                "status": "sent",
                "provider_message_id": provider_message_id,
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

    @staticmethod
    def _extract_message_id(response):
        """
        Africa's Talking returns a dict shaped like:

            {
                "SMSMessageData": {
                    "Message": "Sent to 1/1 recipients",
                    "Recipients": [
                        {"number": "+...", "cost": "1.00",
                         "messageId": "msg-abc-123"},
                        ...
                    ],
                }
            }

        Extract a single string message id from the first recipient when
        available; otherwise return None.
        """
        if not isinstance(response, dict):
            return None

        data = response.get("SMSMessageData")
        if not isinstance(data, dict):
            return None

        recipients = data.get("Recipients")
        if not isinstance(recipients, list) or not recipients:
            return None

        first = recipients[0]
        if not isinstance(first, dict):
            return None

        message_id = first.get("messageId")
        if isinstance(message_id, str) and message_id:
            return message_id

        return None