#  backend/app/services/event_validation_service.py

from fastapi import HTTPException

from app.events.registry import EVENT_REGISTRY


class EventValidationService:

    @staticmethod
    def validate(
        event_type: str,
        payload: dict,
    ) -> dict:

        schema = EVENT_REGISTRY.get(event_type)

        if schema is None:
            raise HTTPException(
                status_code=422,
                detail=f"Unsupported event type '{event_type}'.",
            )

        validated = schema.model_validate(payload)

        return validated.model_dump()