# backend/app/workers/notification_worker.py


# from django.contrib.gis import db

from app.database.session import SessionLocal
from app.models.event import Event
from app.models.notification import Notification

from app.repositories.provider_repository import ProviderRepository
from app.repositories.template_repository import TemplateRepository

from app.services.provider_resolver import ProviderResolver
from app.services.routing_service import RoutingService
from app.services.template_service import TemplateService

from app.workers.worker import celery_app

import time

from app.repositories.notification_repository import NotificationRepository
from app.services.notification_service import NotificationService


@celery_app.task(name="app.workers.notification_worker.process_notification")
def process_notification(notification_id: str):
    """
    Process a queued notification.

    Sprint 3
    --------
    - Verify Celery execution
    - Update notification status
    - Update event status

    Sprint 4
    --------
    - Resolve provider
    - Resolve template
    - Render template
    - Build delivery payload
    """

    db = SessionLocal()

    start = time.perf_counter()

    notification_repository = NotificationRepository(db)
    notification_service = NotificationService(notification_repository)


    try:

        print("=" * 60)
        print(f"Processing notification {notification_id}")
        print("=" * 60)

        # -------------------------------------------------
        # Load Notification
        # -------------------------------------------------

        notification = (
            db.query(Notification)
            .filter(Notification.id == notification_id)
            .first()
        )

        if notification is None:
            print("Notification not found.")

            return {
                "status": "failed",
                "reason": "notification not found",
            }

        # -------------------------------------------------
        # Load Event
        # -------------------------------------------------

        event = (
            db.query(Event)
            .filter(Event.id == notification.event_id)
            .first()
        )

        if event is None:

            notification.status = "dead_letter"
            notification.failure_reason = "event not found"
            db.commit()

            return {
                "status": "dead_letter",
                "reason": "event not found",
            }

        # -------------------------------------------------
        # Build Services
        # -------------------------------------------------

        template_repository = TemplateRepository(db)
        provider_repository = ProviderRepository(db)

        template_service = TemplateService(
            template_repository
        )

        provider_resolver = ProviderResolver(
            provider_repository
        )

        routing_service = RoutingService(
            template_service,
            provider_resolver,
        )

        # -------------------------------------------------
        # Resolve Route
        # -------------------------------------------------

        route = routing_service.build_route(
            event_type=event.event_type,
            channel=notification.channel,
        )

        template = route["template"]

        # provider = route["provider"]

        try:
            provider_model, provider_client = (
                provider_resolver.resolve(
                    notification.channel
                )
            )

        except ValueError as exc:

            elapsed = int(
                (time.perf_counter() - start) * 1000
            )

            notification_service.update_notification(
                notification,
                recipient="",
                provider="unknown",
                status="failed",
                processing_time_ms=elapsed,
                failure_reason=str(exc),
            )

            db.commit()

            return {
                "notification_id": notification.id,
                "status": "failed",
                "reason": str(exc),
            }

        # -------------------------------------------------
        # Render Template
        # -------------------------------------------------

        payload_data = event.payload or {}

        if notification.channel == "email":
            recipient = payload_data.get("email", "")
        elif notification.channel in ("sms", "whatsapp"):
            recipient = payload_data.get("phone", "")
        else:
            recipient = ""

        notification.recipient = recipient

        variables = {
            "customer": payload_data.get(
                "customer",
                "Customer",
            ),
            "amount": payload_data.get(
                "amount",
                "",
            ),
            "reference": payload_data.get(
                "reference",
                "",
            ),
        }

        rendered = template_service.render(
            template,
            variables,
        )

        # -------------------------------------------------
        # Delivery Payload
        # -------------------------------------------------

        delivery_payload = {
            # "provider": provider.name,
            "provider": provider_model.name,
            "channel": notification.channel,
            "recipient": recipient,
            "subject": rendered["subject"],
            "body": rendered["body"],
        }

        print()
        print("Delivery Payload")
        print("-" * 60)
        print(delivery_payload)
        print("-" * 60)

        # -------------------------------------------------
        # Simulate Successful Delivery
        # -------------------------------------------------

       
        result = provider_client.send(
            recipient=recipient,
            subject=rendered["subject"],
            body=rendered["body"],
        )

        elapsed = int((time.perf_counter() - start) * 1000)

        # notification_service.update_notification(
        #     notification,
        #     recipient=recipient,
        #     provider=provider_model.name,
        #     status="delivered" if result["success"] else "failed",
        #     processing_time_ms=elapsed,
        #     failure_reason=result["error"],
        # )

        status = (
            "delivered"
            if result["success"]
            else "dead_letter"
        )

        notification_service.update_notification(
            notification,
            recipient=recipient,
            provider=provider_model.name,
            status=status,
            processing_time_ms=elapsed,
            failure_reason=result["error"],
        )

        if result["success"]:
            event.status = "processed"
            event.is_processed = True

        db.commit()

        print(result)

        return {
            "notification_id": notification.id,
            "status": notification.status,
        }

    except Exception as exc:

        elapsed = int((time.perf_counter() - start) * 1000)

        if "notification" in locals():

            # notification_service.update_notification(
            #     notification,
            #     recipient="",
            #     provider="unknown",
            #     status="failed",
            #     processing_time_ms=elapsed,
            #     failure_reason=str(exc),
            # )

            notification_service.update_notification(
                notification,
                recipient=notification.recipient,
                provider=notification.provider or "unknown",
                status="dead_letter",
                processing_time_ms=elapsed,
                failure_reason=str(exc),
            )

        db.rollback()
        raise

    finally:

        db.close()