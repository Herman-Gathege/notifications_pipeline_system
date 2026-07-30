# backend/app/providers/base.py

from abc import ABC, abstractmethod


class NotificationProvider(ABC):

    @abstractmethod
    def send(
        self,
        *,
        recipient: str,
        subject: str,
        body: str,
    ) -> dict:
        """
        Sends a notification.

        Returns:
        {
            "success": bool,
            "provider_message_id": "...",
            "status": "sent",
            "error": None
        }
        """
        pass