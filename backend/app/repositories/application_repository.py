#backend/app/repositories/application_repository.py
# from uuid import UUID

from sqlalchemy.orm import Session

from app.models.application import Application


class ApplicationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, application: Application) -> Application:
        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        return application

    def get_all(self) -> list[Application]:
        return self.db.query(Application).all()

    def get_by_id(self, application_id: str) -> Application | None:
        return (
            self.db.query(Application)
            .filter(Application.id == application_id)
            .first()
        )

    def get_by_name(self, name: str) -> Application | None:
        return (
            self.db.query(Application)
            .filter(Application.name == name)
            .first()
        )

    def get_by_owner(self, owner_id: str) -> list[Application]:
        return (
            self.db.query(Application)
            .filter(Application.owner_id == owner_id)
            .all()
        )

    # def get_by_api_key(self, api_key: str) -> Application | None:
    #     return (
    #         self.db.query(Application)
    #         .filter(Application.api_key == api_key)
    #         .first()
    #     )

    def update(self, application: Application) -> Application:
        self.db.commit()
        self.db.refresh(application)
        return application

    def delete(self, application: Application) -> None:
        self.db.delete(application)
        self.db.commit()
        return None