# backend/app/repositories/template_repository.py


from uuid import UUID

from sqlalchemy.orm import Session

from app.models.template import Template


class TemplateRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, template: Template) -> Template:
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def get_by_id(self, template_id: UUID) -> Template | None:
        return (
            self.db.query(Template)
            .filter(Template.id == template_id)
            .first()
        )

    def get_by_event_and_channel(
        self,
        event_type: str,
        channel: str,
    ) -> Template | None:
        return (
            self.db.query(Template)
            .filter(
                Template.event_type == event_type,
                Template.channel == channel,
                Template.is_active.is_(True),
            )
            .first()
        )

    def list(self) -> list[Template]:
        return (
            self.db.query(Template)
            .order_by(Template.created_at.desc())
            .all()
        )

    def update(self, template: Template) -> Template:
        self.db.commit()
        self.db.refresh(template)
        return template

    def delete(self, template: Template) -> None:
        self.db.delete(template)
        self.db.commit()
