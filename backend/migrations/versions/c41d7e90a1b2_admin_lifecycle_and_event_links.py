"""user deactivation flag and announcement/event link

Revision ID: c41d7e90a1b2
Revises: 9a4bc8d2e031
Create Date: 2026-11-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c41d7e90a1b2"
down_revision: Union[str, Sequence[str], None] = "9a4bc8d2e031"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
    with op.batch_alter_table("announcements") as batch:
        batch.add_column(sa.Column("event_id", sa.String(length=50), nullable=True))
    op.create_index("ix_announcements_event_id", "announcements", ["event_id"])


def downgrade() -> None:
    op.drop_index("ix_announcements_event_id", table_name="announcements")
    with op.batch_alter_table("announcements") as batch:
        batch.drop_column("event_id")
    with op.batch_alter_table("users") as batch:
        batch.drop_column("is_active")
