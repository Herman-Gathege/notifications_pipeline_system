# backend/app/providers/sms/sms_provider.py

import africastalking

from app.config.settings import settings
from app.providers.base import NotificationProvider


# Module-level handle to the Africa's Talking SDK client.  Intentionally
# left as ``None`` at import time so that the SDK is initialized lazily
# inside ``SMSProvider.__init__`` — this is required to keep SSL state
# fork-safe in the Celery worker.
sms = None


class SMSProvider(NotificationProvider):

    def __init__(self) -> None:
        # IMPORTANT: initialize the Africa's Talking SDK *per instance*
        # rather than at module import time.
        #
        # The SDK creates an internal urllib3 HTTPSConnectionPool with a
        # cached ssl.SSLContext.  That context is not fork-safe: when the
        # Celery main process pre-initializes the SDK at import time and
        # then forks worker children, the children inherit a broken
        # SSLContext and the first HTTPS call to Africa's Talking
        # surfaces as:
        #
        #     ssl.SSLError: [SSL: WRONG_VERSION_NUMBER] wrong version number
        #
        # Initializing lazily here means every forked worker child
        # constructs a fresh SDK instance with a fresh SSL context on
        # first use.
        #
        # The module-level ``sms`` attribute remains as a seam for
        # tests that inject a mock SDK client.  When a non-None mock is
        # already present (test scenario), use it; otherwise initialize
        # a real SDK client for this process.
        global sms
        if sms is None:
            africastalking.initialize(
                settings.AFRICASTALKING_USERNAME,
                settings.AFRICASTALKING_API_KEY,
            )
            sms = africastalking.SMS
        self._sms = sms

    def send(
        self,
        *,
        recipient: str,
        subject: str,
        body: str,
    ) -> dict:

        try:

            response = self._sms.send(
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