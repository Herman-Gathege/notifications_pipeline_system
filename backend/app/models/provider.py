# backend/app/models/provider.py

from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database.base import Base


class Provider(Base):
    __tablename__ = "providers"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    channel: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    priority: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    transport_type: Mapped[str] = mapped_column(
    String(20),
    default="api",
    nullable=False,
    )

    smtp_host: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    smtp_port: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    smtp_username: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    smtp_password: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    use_tls: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    use_ssl: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    from_email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    from_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )