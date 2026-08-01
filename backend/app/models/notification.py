# backend/app/models/notification.py
from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    event_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    recipient: Mapped[str] = mapped_column(
        String(255),
        default="",
        nullable=False,
    )

    channel: Mapped[str] = mapped_column(
        String(50),
        default="email",
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="queued",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    event = relationship(
        "Event",
        back_populates="notifications",
    )

    provider: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    processing_time_ms: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    failure_reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )