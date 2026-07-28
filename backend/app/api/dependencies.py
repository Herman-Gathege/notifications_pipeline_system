# backend/app/api/dependencies.py

from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.session import SessionLocal

from app.repositories.application_repository import (
    ApplicationRepository,
)
from app.repositories.event_repository import (
    EventRepository,
)
from app.repositories.notification_repository import (
    NotificationRepository,
)
from app.repositories.provider_repository import (
    ProviderRepository,
)
from app.repositories.template_repository import (
    TemplateRepository,
)

from app.services.application_service import (
    ApplicationService,
)
from app.services.event_service import (
    EventService,
)
from app.services.provider_resolver import (
    ProviderResolver,
)
from app.services.provider_service import (
    ProviderService,
)
from app.services.routing_service import (
    RoutingService,
)
from app.services.template_service import (
    TemplateService,
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ---------------------------------------------------------
# Existing services
# ---------------------------------------------------------

def get_application_service(
    db: Session = Depends(get_db),
):
    return ApplicationService(
        ApplicationRepository(db),
    )


def get_event_service(
    db: Session = Depends(get_db),
):
    return EventService(
        EventRepository(db),
        NotificationRepository(db),
    )


# ---------------------------------------------------------
# Sprint 4
# ---------------------------------------------------------

def get_template_service(
    db: Session = Depends(get_db),
):
    return TemplateService(
        TemplateRepository(db),
    )


def get_provider_service(
    db: Session = Depends(get_db),
):
    return ProviderService(
        ProviderRepository(db),
    )


def get_provider_resolver(
    db: Session = Depends(get_db),
):
    return ProviderResolver(
        ProviderRepository(db),
    )


def get_routing_service(
    db: Session = Depends(get_db),
):
    template_service = TemplateService(
        TemplateRepository(db),
    )

    provider_resolver = ProviderResolver(
        ProviderRepository(db),
    )

    return RoutingService(
        template_service,
        provider_resolver,
    )