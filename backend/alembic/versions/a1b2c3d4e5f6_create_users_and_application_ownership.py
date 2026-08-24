"""create users table and application ownership

Revision ID: a1b2c3d4e5f6
Revises: f048d2ab287f
Create Date: 2026-08-21 10:30:00.000000
"""

from typing import Sequence, Union

import bcrypt
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f048d2ab287f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.add_column(
        "applications",
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
    )

    conn = op.get_bind()
    default_admin_id = conn.execute(text("SELECT gen_random_uuid()::text")).scalar_one()

    import os

    admin_email = os.environ.get("INITIAL_ADMIN_EMAIL")
    admin_password = os.environ.get("INITIAL_ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        raise RuntimeError(
            "INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be set "
            "to bootstrap the initial admin user."
        )

    hashed_password = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()

    conn.execute(
        text(
            "INSERT INTO users (id, email, hashed_password, name, role, is_active, created_at, updated_at) "
            "VALUES (:id, :email, :password, :name, :role, :active, NOW(), NOW())"
        ),
        {
            "id": default_admin_id,
            "email": admin_email,
            "password": hashed_password,
            "name": "Admin",
            "role": "admin",
            "active": True,
        },
    )

    conn.execute(
        text(
            "UPDATE applications SET owner_id = :admin_id WHERE owner_id IS NULL"
        ),
        {"admin_id": default_admin_id},
    )

    op.alter_column("applications", "owner_id", existing_type=sa.String(36), nullable=False)


def downgrade() -> None:
    op.drop_column("applications", "owner_id")
    op.drop_table("users")
