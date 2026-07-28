# backend/app/services/template_service.py

from app.models.template import Template
from app.repositories.template_repository import TemplateRepository
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
)


class TemplateService:
    def __init__(self, repository: TemplateRepository):
        self.repository = repository

    def create(self, data: TemplateCreate) -> Template:
        template = Template(**data.model_dump())
        return self.repository.create(template)

    def get(self, template_id):
        return self.repository.get_by_id(template_id)

    def get_for_event(
        self,
        event_type: str,
        channel: str,
    ):
        return self.repository.get_by_event_and_channel(
            event_type,
            channel,
        )

    def list(self):
        return self.repository.list()

    def update(
        self,
        template: Template,
        data: TemplateUpdate,
    ):
        update_data = data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(template, key, value)

        return self.repository.update(template)

    def delete(self, template: Template):
        self.repository.delete(template)