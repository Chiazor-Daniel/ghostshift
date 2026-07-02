"""no-op migration - check-in columns now in initial migration

Revision ID: 9b4d8e2c1f3a
Revises: 8a3c7d9e2f1b
Create Date: 2026-06-30 14:00:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = '9b4d8e2c1f3a'
down_revision: Union[str, Sequence[str], None] = '8a3c7d9e2f1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
