#backend/app/repositories/apikey_repository.py
from sqlalchemy.orm import Session

from app.models.api_key import APIKey


class APIKeyRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, api_key: APIKey) -> APIKey:
        self.db.add(api_key)
        self.db.commit()
        self.db.refresh(api_key)
        return api_key

    def get_by_token(self, token: str) -> APIKey | None:
        return (
            self.db.query(APIKey)
            .filter(APIKey.token == token)
            .first()
        )

    def update(self, api_key: APIKey) -> APIKey:
        self.db.commit()
        self.db.refresh(api_key)
        return api_key

    def delete(self, api_key: APIKey) -> None:
        self.db.delete(api_key)
        self.db.commit()