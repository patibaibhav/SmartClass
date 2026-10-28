"""shared quiz class memberships

Revision ID: 7f3a1c5e8d12
Revises: 5d7e9a2c4f11
Create Date: 2026-10-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7f3a1c5e8d12"
down_revision: Union[str, Sequence[str], None] = "5d7e9a2c4f11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "quiz_class_memberships",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("quiz_id", sa.String(length=50), nullable=False),
        sa.Column("class_id", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["classes.id"]),
        sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("quiz_id", "class_id", name="uq_quiz_class_membership"),
    )
    op.create_index("ix_quiz_class_memberships_quiz_id", "quiz_class_memberships", ["quiz_id"])
    op.create_index("ix_quiz_class_memberships_class_id", "quiz_class_memberships", ["class_id"])
    with op.batch_alter_table("quizzes") as batch_op:
        batch_op.alter_column("class_id", existing_type=sa.String(length=50), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("quizzes") as batch_op:
        batch_op.alter_column("class_id", existing_type=sa.String(length=50), nullable=False)
    op.drop_index("ix_quiz_class_memberships_class_id", table_name="quiz_class_memberships")
    op.drop_index("ix_quiz_class_memberships_quiz_id", table_name="quiz_class_memberships")
    op.drop_table("quiz_class_memberships")
