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

import time
import logging

from app.repositories.notification_repository import NotificationRepository
from app.services.notification_service import NotificationService
from app.monitoring.metrics import (
    notifications_processed_total,
    notification_processing_seconds,
)

logger = logging.getLogger("fikatu.worker")

UNRESOLVED_PLACEHOLDER = "{{"


def _derive_variables(payload: dict) -> dict:
    """
    Derive a variables dict from the event payload so that templates can
    substitute relevant fields such as otp, name, reset_link, etc.

    Only string-like scalar values are exposed; internal/unrelated fields
    are not duplicated into the template context.
    """
    variables: dict[str, str] = {}

    if not isinstance(payload, dict):
        return variables

    for key, value in payload.items():
        if value is None:
            continue
        if isinstance(value, (str, int, float, bool)):
            variables[key] = str(value)

    if "customer" not in variables:
        variables["customer"] = "Customer"

    return variables


def _has_unresolved_placeholders(text: str | None) -> bool:
    if not text:
        return False
    return UNRESOLVED_PLACEHOLDER in text


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

        logger.info("Processing notification %s", notification_id)

        # -------------------------------------------------
        # Load Notification
        # -------------------------------------------------

        notification = (
            db.query(Notification)
            .filter(Notification.id == notification_id)
            .first()
        )

        if notification is None:
            logger.warning("Notification not found: %s", notification_id)

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

            notification_processing_seconds.observe(elapsed / 1000)
            notifications_processed_total.inc()

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
        # Determine Recipient
        # -------------------------------------------------

        payload_data = event.payload or {}

        if notification.channel == "email":
            recipient = payload_data.get("email", "") or ""
        elif notification.channel in ("sms", "whatsapp"):
            recipient = payload_data.get("phone", "") or ""
        else:
            recipient = ""

        if notification.channel in ("sms", "whatsapp"):
            phone = (recipient or "").strip()
            if not phone:
                elapsed = int(
                    (time.perf_counter() - start) * 1000
                )

                notification_processing_seconds.observe(elapsed / 1000)
                notifications_processed_total.inc()

                notification_service.update_notification(
                    notification,
                    recipient="",
                    provider=provider_model.name,
                    status="dead_letter",
                    processing_time_ms=elapsed,
                    failure_reason="Missing recipient phone number",
                )

                db.commit()

                return {
                    "notification_id": notification.id,
                    "status": "dead_letter",
                    "reason": "Missing recipient phone number",
                }

            recipient = phone

        notification.recipient = recipient

        # -------------------------------------------------
        # Render Template
        # -------------------------------------------------

        variables = _derive_variables(payload_data)

        rendered = template_service.render(
            template,
            variables,
        )

        if _has_unresolved_placeholders(rendered.get("body")) or (
            notification.channel != "sms"
            and _has_unresolved_placeholders(rendered.get("subject"))
        ):
            elapsed = int(
                (time.perf_counter() - start) * 1000
            )

            notification_processing_seconds.observe(elapsed / 1000)
            notifications_processed_total.inc()

            notification_service.update_notification(
                notification,
                recipient=recipient,
                provider=provider_model.name,
                status="dead_letter",
                processing_time_ms=elapsed,
                failure_reason="Template contains unresolved placeholders",
            )

            db.commit()

            return {
                "notification_id": notification.id,
                "status": "dead_letter",
                "reason": "Template contains unresolved placeholders",
            }

        # -------------------------------------------------
        # Delivery
        # -------------------------------------------------

        delivery_payload = {
            "provider": provider_model.name,
            "channel": notification.channel,
            "recipient": recipient,
            "subject": rendered["subject"],
            "body": rendered["body"],
        }

        logger.info("Delivery payload: %s", delivery_payload)

        result = provider_client.send(
            recipient=recipient,
            subject=rendered["subject"],
            body=rendered["body"],
        )

        elapsed = int((time.perf_counter() - start) * 1000)

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

        logger.info("Result: %s", result)

        return {
            "notification_id": notification.id,
            "status": notification.status,
        }

    except Exception as exc:

        elapsed = int((time.perf_counter() - start) * 1000)

        if "notification" in locals():

            notification_service.update_notification(
                notification,
                recipient=getattr(notification, "recipient", "") or "",
                provider=getattr(notification, "provider", None) or "unknown",
                status="dead_letter",
                processing_time_ms=elapsed,
                failure_reason=str(exc),
            )

        db.rollback()
        raise

    finally:

        db.close()