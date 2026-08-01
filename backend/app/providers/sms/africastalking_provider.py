# backend/app/providers/sms/africastalking_provider.py

import httpx

from app.providers.base import NotificationProvider


class AfricasTalkingProvider(NotificationProvider):

    BASE_URL = (
        "https://api.sandbox.africastalking.com/version1/messaging"
    )

    def __init__(
        self,
        *,
        username: str,
        api_key: str,
        sender_id: str | None = None,
    ):
        self.username = username
        self.api_key = api_key
        self.sender_id = sender_id

    def send(
        self,
        *,
        recipient: str,
        body: str,
        subject: str | None = None,
    ) -> dict:

        payload = {
            "username": self.username,
            "to": recipient,
            "message": body,
        }

        if self.sender_id:
            payload["from"] = self.sender_id

        headers = {
            "Accept": "application/json",
            "apiKey": self.api_key,
        }

        try:

            response = httpx.post(
                self.BASE_URL,
                data=payload,
                headers=headers,
                timeout=30,
            )

            response.raise_for_status()

            print("=" * 80)
            print("AFRICA'S TALKING RESPONSE")
            print(response.status_code)
            print(response.text)
            print("=" * 80)

            data = response.json()

            return {
                "success": True,
                "status": "sent",
                "provider_message_id": data,
                "status_code": response.status_code,
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