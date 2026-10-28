"""assignment text submissions

Revision ID: 5d7e9a2c4f11
Revises: 2c6f8d4a9b10
Create Date: 2026-10-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5d7e9a2c4f11"
down_revision: Union[str, Sequence[str], None] = "2c6f8d4a9b10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("assignment_submissions") as batch_op:
        batch_op.alter_column(
            "submission_file", existing_type=sa.String(length=255), nullable=True
        )
        batch_op.add_column(sa.Column("submission_text", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("assignment_submissions") as batch_op:
        batch_op.drop_column("submission_text")
        batch_op.alter_column(
            "submission_file", existing_type=sa.String(length=255), nullable=False
        )
