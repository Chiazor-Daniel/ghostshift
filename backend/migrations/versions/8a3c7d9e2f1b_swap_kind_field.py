"""Add kind column to swap_requests; allow null requester_shift_id

Revision ID: 8a3c7d9e2f1b
Revises: 17af5c6cf007
Create Date: 2026-06-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a3c7d9e2f1b'
down_revision: Union[str, Sequence[str], None] = '17af5c6cf007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Allow requester_shift_id to be null so marketplace pickups don't fake a swap
    op.alter_column(
        'swap_requests',
        'requester_shift_id',
        existing_type=sa.String(length=50),
        nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'swap_requests',
        'requester_shift_id',
        existing_type=sa.String(length=50),
        nullable=False,
    )
