"""PEC elective enrollments

Revision ID: 2c6f8d4a9b10
Revises: b8a9473e55d3
Create Date: 2026-10-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2c6f8d4a9b10"
down_revision: Union[str, Sequence[str], None] = "b8a9473e55d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "elective_enrollments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.String(length=50), nullable=False),
        sa.Column("academic_class_id", sa.String(length=50), nullable=False),
        sa.Column("course_id", sa.String(length=50), nullable=False),
        sa.Column("batch_code", sa.String(length=20), nullable=False),
        sa.Column("source", sa.String(length=30), nullable=False),
        sa.Column("source_sheet", sa.String(length=100), nullable=False),
        sa.Column("source_row", sa.Integer(), nullable=False),
        sa.Column("source_record_key", sa.String(length=150), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["academic_class_id"], ["classes.id"]),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_record_key", name="uq_elective_enrollment_source"),
        sa.UniqueConstraint("student_id", name="uq_elective_enrollment_student"),
    )
    op.create_index("ix_elective_enrollments_student_id", "elective_enrollments", ["student_id"])
    op.create_index("ix_elective_enrollments_academic_class_id", "elective_enrollments", ["academic_class_id"])
    op.create_index("ix_elective_enrollments_course_id", "elective_enrollments", ["course_id"])


def downgrade() -> None:
    op.drop_index("ix_elective_enrollments_course_id", table_name="elective_enrollments")
    op.drop_index("ix_elective_enrollments_academic_class_id", table_name="elective_enrollments")
    op.drop_index("ix_elective_enrollments_student_id", table_name="elective_enrollments")
    op.drop_table("elective_enrollments")
