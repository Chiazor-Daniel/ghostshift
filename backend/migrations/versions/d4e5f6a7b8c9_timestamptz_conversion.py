"""Convert all TIMESTAMP columns to TIMESTAMPTZ (timezone-aware)

Revision ID: d4e5f6a7b8c9
Revises: a7c3d8f1b2e4
Create Date: 2026-07-02 06:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'a7c3d8f1b2e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TIMESTAMP_TABLES = {
    "organizations": ["created_at", "updated_at"],
    "departments": ["created_at", "updated_at"],
    "leave_policies": ["created_at", "updated_at"],
    "users": ["hired_at", "last_active", "created_at", "updated_at"],
    "shifts": ["start_time", "end_time", "check_in_at", "check_out_at", "created_at", "updated_at"],
    "attendance": ["clock_in", "clock_out", "created_at", "updated_at"],
    "swap_requests": ["expires_at", "approved_at", "rejected_at", "created_at", "updated_at"],
    "leave_requests": ["start_date", "end_date", "decided_at", "approved_at", "rejected_at", "created_at", "updated_at"],
    "availability": ["start_date", "end_date", "created_at", "updated_at"],
    "notifications": ["read_at", "archived_at", "created_at", "updated_at"],
    "audit_logs": ["created_at"],
    "certification_alerts": ["expiry_date", "resolved_at", "created_at", "updated_at"],
    "peak_hour_risk": ["date", "created_at"],
    "invites": ["expires_at", "accepted_at", "created_at", "updated_at"],
    # conversation_turns is created by model.create_all() with timezone=True already
    # "conversation_turns": ["created_at"],
}


def upgrade() -> None:
    for table, columns in TIMESTAMP_TABLES.items():
        for col in columns:
            op.execute(
                f"ALTER TABLE {table} ALTER COLUMN {col} "
                f"TYPE TIMESTAMP WITH TIME ZONE "
                f"USING {col} AT TIME ZONE 'UTC'"
            )


def downgrade() -> None:
    for table, columns in TIMESTAMP_TABLES.items():
        for col in columns:
            op.execute(
                f"ALTER TABLE {table} ALTER COLUMN {col} "
                f"TYPE TIMESTAMP WITHOUT TIME ZONE"
            )
