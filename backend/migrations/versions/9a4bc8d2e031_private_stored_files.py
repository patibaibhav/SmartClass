"""private stored-file metadata

Revision ID: 9a4bc8d2e031
Revises: 7f3a1c5e8d12
Create Date: 2026-10-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9a4bc8d2e031"
down_revision: Union[str, Sequence[str], None] = "7f3a1c5e8d12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "stored_files",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("bucket", sa.String(length=100), nullable=False),
        sa.Column("object_key", sa.String(length=500), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=150), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("uploaded_by_id", sa.String(length=50), nullable=False),
        sa.Column("course_id", sa.String(length=50), nullable=False),
        sa.Column("material_id", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["material_id"], ["study_materials.id"]),
        sa.ForeignKeyConstraint(["uploaded_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("material_id", name="uq_stored_file_material"),
        sa.UniqueConstraint("object_key", name="uq_stored_file_object_key"),
    )
    op.create_index("ix_stored_files_course_id", "stored_files", ["course_id"])
    op.create_index("ix_stored_files_material_id", "stored_files", ["material_id"])
    op.create_index("ix_stored_files_uploaded_by_id", "stored_files", ["uploaded_by_id"])


def downgrade() -> None:
    op.drop_index("ix_stored_files_uploaded_by_id", table_name="stored_files")
    op.drop_index("ix_stored_files_material_id", table_name="stored_files")
    op.drop_index("ix_stored_files_course_id", table_name="stored_files")
    op.drop_table("stored_files")
