"""Add temp_password to invites so the invite link can show credentials

Revision ID: a7c3d8f1b2e4
Revises: 9b4d8e2c1f3a
Create Date: 2026-07-01 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c3d8f1b2e4'
down_revision: Union[str, Sequence[str], None] = '9b4d8e2c1f3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'invites',
        sa.Column('temp_password', sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('invites', 'temp_password')
