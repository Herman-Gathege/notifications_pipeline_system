# backend/app/services/application_service.py

from secrets import token_hex
from uuid import UUID

from app.models.application import Application
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import ApplicationUpdate


class ApplicationService:
    def __init__(self, repository: ApplicationRepository):
        self.repository = repository

    def create_application(self, name: str) -> Application:
        existing = self.repository.get_by_name(name)

        if existing:
            raise ValueError("Application already exists.")

        application = Application(
            name=name,
            # api_key=token_hex(16),
            secret=token_hex(32),
            status=True,
        )

        return self.repository.create(application)

    def get_all(self):
        return self.repository.get_all()

    def get_by_id(self, application_id: UUID):
        return self.repository.get_by_id(application_id)

    def update(
        self,
        application_id: UUID,
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

    def delete(self, application_id: UUID):
        application = self.repository.get_by_id(application_id)

        if application is None:
            return False

        self.repository.delete(application)

        return True