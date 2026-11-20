"""council event draft state

Revision ID: e63f9ab2c4d4
Revises: d52e8fa1b3c3
Create Date: 2026-11-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e63f9ab2c4d4"
down_revision: Union[str, Sequence[str], None] = "d52e8fa1b3c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("council_events") as batch:
        batch.add_column(sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade() -> None:
    with op.batch_alter_table("council_events") as batch:
        batch.drop_column("is_published")
