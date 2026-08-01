# backend/app/models/notification_report.py

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database.base import Base


class NotificationReport(Base):
    __tablename__ = "notification_reports"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    period_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    period_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    notifications_processed: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    successful_notifications: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    failed_notifications: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    email_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    sms_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    whatsapp_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    best_provider: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    provider_statistics: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )