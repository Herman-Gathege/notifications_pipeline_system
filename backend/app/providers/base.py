# backend/app/providers/base.py

from abc import ABC, abstractmethod


class NotificationProvider(ABC):

    @abstractmethod
    def send(
        self,
        *,
        recipient: str,
        body: str,
        subject: str | None = None,
    ) -> dict:
        """
        Sends a notification.

        Returns:
        {
            "success": bool,
            "provider_message_id": "...",
            "status": "sent",
            "status_code": int | None,
            "error": str | None,
        }
        """
        raise NotImplementedError