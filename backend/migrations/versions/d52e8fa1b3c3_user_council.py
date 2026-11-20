"""council name on council-head accounts

Revision ID: d52e8fa1b3c3
Revises: c41d7e90a1b2
Create Date: 2026-11-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d52e8fa1b3c3"
down_revision: Union[str, Sequence[str], None] = "c41d7e90a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("council", sa.String(length=100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("council")
