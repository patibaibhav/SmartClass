"""link stored files to assignment submissions

Revision ID: f85a0bc3d5e5
Revises: e63f9ab2c4d4
Create Date: 2026-11-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f85a0bc3d5e5"
down_revision: Union[str, Sequence[str], None] = "e63f9ab2c4d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("stored_files") as batch:
        batch.add_column(sa.Column("submission_id", sa.Integer(), nullable=True))
    op.create_index("ix_stored_files_submission_id", "stored_files", ["submission_id"])


def downgrade() -> None:
    op.drop_index("ix_stored_files_submission_id", table_name="stored_files")
    with op.batch_alter_table("stored_files") as batch:
        batch.drop_column("submission_id")
