"""hash existing plaintext passwords

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-21 11:40:00.000000
"""

from typing import Sequence, Union

import bcrypt
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6g7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(text("SELECT id, hashed_password FROM users"))
    rows = result.fetchall()

    for row in rows:
        user_id = row[0]
        password = row[1]

        if not password.startswith("$2"):
            hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            conn.execute(
                text("UPDATE users SET hashed_password = :p WHERE id = :id"),
                {"p": hashed, "id": user_id},
            )


def downgrade() -> None:
    pass
