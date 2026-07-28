# backend/app/workers/notification_worker.py

from app.database.session import SessionLocal
from app.models.event import Event
from app.models.notification import Notification

from app.repositories.provider_repository import ProviderRepository
from app.repositories.template_repository import TemplateRepository

from app.services.provider_resolver import ProviderResolver
from app.services.routing_service import RoutingService
from app.services.template_service import TemplateService

from app.workers.worker import celery_app


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

            notification.status = "failed"
            db.commit()

            return {
                "status": "failed",
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
        provider = route["provider"]

        # -------------------------------------------------
        # Render Template
        # -------------------------------------------------

        payload_data = event.payload or {}

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
            "provider": provider.name,
            "channel": notification.channel,
            "recipient": notification.recipient,
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

        notification.status = "processed"

        event.status = "processed"
        event.is_processed = True

        db.commit()

        print("Notification processed successfully.")
        print("=" * 60)

        return {
            "notification_id": notification.id,
            "status": notification.status,
        }

    except Exception:

        db.rollback()
        raise

    finally:

        db.close()