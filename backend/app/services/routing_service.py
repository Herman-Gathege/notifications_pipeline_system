# backend/app/services/routing_service.py

from app.services.provider_resolver import ProviderResolver
from app.services.template_service import TemplateService


class RoutingService:
    """
    Determines how a notification should be sent.

    Responsibilities:

    - Find template
    - Select provider
    - Build delivery plan

    Sprint 5 will use this plan to actually send
    notifications through external providers.
    """

    def __init__(
        self,
        template_service: TemplateService,
        provider_resolver: ProviderResolver,
    ):
        self.template_service = template_service
        self.provider_resolver = provider_resolver

    def build_route(
        self,
        event_type: str,
        channel: str,
    ):

        template = self.template_service.get_for_event(
            event_type,
            channel,
        )

        if template is None:
            raise ValueError(
                f"No template found for "
                f"{event_type} ({channel})"
            )

        provider = self.provider_resolver.resolve(channel)

        if provider is None:
            raise ValueError(
                f"No active provider for channel '{channel}'"
            )

        return {
            "template": template,
            "provider": provider,
            "channel": channel,
        }