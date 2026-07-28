# backend/app/repositories/provider_repository.py

from sqlalchemy.orm import Session

from app.models.provider import Provider

from sqlalchemy.exc import IntegrityError



class ProviderRepository:
    def __init__(self, db: Session):
        self.db = db

    # def create(self, provider: Provider) -> Provider:
    #     self.db.add(provider)
    #     self.db.commit()
    #     self.db.refresh(provider)
    #     return provider


    def create(
        self,
        provider: Provider,
    ) -> Provider:

        self.db.add(provider)

        try:
            self.db.commit()

        except IntegrityError:
            self.db.rollback()
            raise

        self.db.refresh(provider)

        return provider

    def get_by_id(self, provider_id):
        return (
            self.db.query(Provider)
            .filter(Provider.id == provider_id)
            .first()
        )

    def get_active_by_channel(
        self,
        channel: str,
    ) -> list[Provider]:
        return (
            self.db.query(Provider)
            .filter(
                Provider.channel == channel,
                Provider.is_active.is_(True),
            )
            .order_by(Provider.priority.asc())
            .all()
        )

    def list(self) -> list[Provider]:
        return (
            self.db.query(Provider)
            .order_by(
                Provider.priority.asc(),
                Provider.name.asc(),
            )
            .all()
        )

    def update(self, provider: Provider) -> Provider:
        self.db.commit()
        self.db.refresh(provider)
        return provider

    def delete(self, provider: Provider) -> None:
        self.db.delete(provider)
        self.db.commit()
