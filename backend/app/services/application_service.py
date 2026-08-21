# backend/app/services/application_service.py

from secrets import token_hex
# from uuid import UUID

from app.models.application import Application
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import ApplicationUpdate
from app.services.apikey_service import APIKeyService


class ApplicationService:
    def __init__(self, repository: ApplicationRepository, api_key_service: APIKeyService):
        self.repository = repository
        self.api_key_service = api_key_service

    def create_application(self, name: str, owner_id: str | None = None) -> Application:
        existing = self.repository.get_by_name(name)

        if existing:
            raise ValueError("Application already exists.")

        application = Application(
            name=name,
            secret=token_hex(32),
            status=True,
            owner_id=owner_id,
        )

        application = self.repository.create(application)

        api_key = self.api_key_service.create_key(application.id)

        return application, api_key

    def get_all(self):
        return self.repository.get_all()

    def get_by_id(self, application_id: str):
        return self.repository.get_by_id(application_id)

    def update(
        self,
        application_id: str,
        payload: ApplicationUpdate,
    ):
        application = self.repository.get_by_id(application_id)

        if application is None:
            return None

        if payload.name is not None:
            application.name = payload.name

        if payload.status is not None:
            application.status = payload.status

        return self.repository.update(application)

    def delete(self, application_id: str):
        application = self.repository.get_by_id(application_id)

        if application is None:
            return False

        self.repository.delete(application)

        return True