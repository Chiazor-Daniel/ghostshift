"""Initial migration

Revision ID: 17af5c6cf007
Revises: 
Create Date: 2026-06-29 10:35:08.121272

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '17af5c6cf007'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Organizations table
    op.create_table('organizations',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), unique=True, index=True),
        sa.Column('logo_url', sa.String(500)),
        sa.Column('cover_url', sa.String(500)),
        sa.Column('description', sa.String(1000)),
        sa.Column('website', sa.String(255)),
        sa.Column('phone', sa.String(50)),
        sa.Column('email', sa.String(255)),
        sa.Column('address', sa.String(500)),
        sa.Column('city', sa.String(100)),
        sa.Column('state', sa.String(50)),
        sa.Column('zip_code', sa.String(20)),
        sa.Column('country', sa.String(100), default='United States'),
        sa.Column('timezone', sa.String(100), default='America/New_York'),
        sa.Column('currency', sa.String(10), default='USD'),
        sa.Column('settings', postgresql.JSON, default=dict),
        sa.Column('features', postgresql.JSON, default=dict),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Departments table (FK to users added later after users is created)
    op.create_table('departments',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(500)),
        sa.Column('manager_id', sa.String(50)),
        sa.Column('headcount', sa.Integer, default=0),
        sa.Column('budget', sa.Integer, default=0),
        sa.Column('settings', postgresql.JSON, default=dict),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Leave policies table
    op.create_table('leave_policies',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(500)),
        sa.Column('accrual_rate', sa.Integer, default=0),
        sa.Column('max_accrual', sa.Integer, default=0),
        sa.Column('rollover_limit', sa.Integer, default=0),
        sa.Column('carryover_limit', sa.Integer, default=0),
        sa.Column('approval_required', sa.Boolean, default=True),
        sa.Column('min_notice_hours', sa.Integer, default=24),
        sa.Column('max_consecutive_days', sa.Integer, default=14),
        sa.Column('settings', postgresql.JSON, default=dict),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Users table
    op.create_table('users',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('email', sa.String(255), unique=True, index=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('initials', sa.String(10)),
        sa.Column('role', sa.String(20), default='employee'),
        sa.Column('title', sa.String(255)),
        sa.Column('department', sa.String(255), index=True),
        sa.Column('department_id', sa.String(50), sa.ForeignKey('departments.id')),
        sa.Column('manager_id', sa.String(50), sa.ForeignKey('users.id')),
        sa.Column('phone', sa.String(50)),
        sa.Column('avatar_url', sa.String(500)),
        sa.Column('cover_color', sa.String(20)),
        sa.Column('hired_at', sa.DateTime),
        sa.Column('certifications', postgresql.JSON, default=list),
        sa.Column('cert_expiry', postgresql.JSON, default=dict),
        sa.Column('weekly_hours_target', sa.Integer, default=36),
        sa.Column('weekly_hours_this_week', sa.Integer, default=0),
        sa.Column('preferences', postgresql.JSON, default=dict),
        sa.Column('burnout_score', sa.Integer, default=0),
        sa.Column('burnout_trend', sa.String(10), default='stable'),
        sa.Column('rating', sa.Integer, default=4),
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('last_active', sa.DateTime),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Shifts table
    op.create_table('shifts',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('department_id', sa.String(50), sa.ForeignKey('departments.id')),
        sa.Column('employee_id', sa.String(50), sa.ForeignKey('users.id')),
        sa.Column('manager_id', sa.String(50), sa.ForeignKey('users.id')),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.String(1000)),
        sa.Column('department', sa.String(255)),
        sa.Column('start_time', sa.DateTime, nullable=False),
        sa.Column('end_time', sa.DateTime, nullable=False),
        sa.Column('duration_hours', sa.Integer, nullable=False),
        sa.Column('start_hour', sa.Integer),
        sa.Column('status', sa.String(20), default='scheduled', nullable=False, index=True),
        sa.Column('type', sa.String(20), default='regular', nullable=False),
        sa.Column('urgency', sa.String(20), default='medium'),
        sa.Column('certifications', postgresql.JSON, default=list),
        sa.Column('pay_differential', sa.String(20), default='+0%'),
        sa.Column('eligible_count', sa.Integer, default=0),
        sa.Column('training_credit', sa.Boolean, default=False),
        sa.Column('seniority_preference', sa.String(20), default='none'),
        sa.Column('required_staff', sa.Integer, default=1),
        sa.Column('assigned_staff', postgresql.JSON, default=list),
        sa.Column('location', sa.String(255)),
        sa.Column('notes', sa.String(1000)),
        sa.Column('requirements', postgresql.JSON, default=dict),
        sa.Column('compensation', postgresql.JSON, default=dict),
        sa.Column('coverage_status', sa.String(50), default='full'),
        sa.Column('assigned_count', sa.Integer, default=0),
        sa.Column('required_count', sa.Integer, default=1),
        sa.Column('tags', postgresql.JSON, default=list),
        sa.Column('check_in_at', sa.DateTime, nullable=True),
        sa.Column('check_out_at', sa.DateTime, nullable=True),
        sa.Column('check_in_notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Attendance table
    op.create_table('attendance',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('shift_id', sa.String(50), sa.ForeignKey('shifts.id'), nullable=False),
        sa.Column('employee_id', sa.String(50), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('clock_in', sa.DateTime),
        sa.Column('clock_out', sa.DateTime),
        sa.Column('actual_hours', sa.Integer),
        sa.Column('status', sa.String(50), default='scheduled'),
        sa.Column('notes', sa.String(500)),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Swap requests table
    op.create_table('swap_requests',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('requester_id', sa.String(50), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('responder_id', sa.String(50), sa.ForeignKey('users.id')),
        sa.Column('requester_shift_id', sa.String(50), sa.ForeignKey('shifts.id')),
        sa.Column('responder_shift_id', sa.String(50), sa.ForeignKey('shifts.id')),
        sa.Column('target_employee_id', sa.String(50), sa.ForeignKey('users.id')),
        sa.Column('status', sa.String(20), default='pending', index=True),
        sa.Column('reason', sa.String(500)),
        sa.Column('ai_match_score', sa.Integer, default=80),
        sa.Column('kind', sa.String(20), default='swap', nullable=False),
        sa.Column('message', sa.String(500)),
        sa.Column('expires_at', sa.DateTime),
        sa.Column('approved_at', sa.DateTime),
        sa.Column('rejected_at', sa.DateTime),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Leave requests table
    op.create_table('leave_requests',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('employee_id', sa.String(50), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('employee_name', sa.String(255)),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('start_date', sa.DateTime, nullable=False),
        sa.Column('end_date', sa.DateTime, nullable=False),
        sa.Column('duration_days', sa.Integer, nullable=False),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('reason', sa.String(1000)),
        sa.Column('approved_by', sa.String(50), sa.ForeignKey('users.id')),
        sa.Column('decided_at', sa.DateTime),
        sa.Column('approved_at', sa.DateTime),
        sa.Column('rejected_at', sa.DateTime),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Availability table
    op.create_table('availability',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('employee_id', sa.String(50), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('day_of_week', sa.Integer, nullable=False),
        sa.Column('start_time', sa.String(10)),
        sa.Column('end_time', sa.String(10)),
        sa.Column('status', sa.String(50), default='available'),
        sa.Column('is_recurring', sa.Boolean, default=True),
        sa.Column('start_date', sa.DateTime),
        sa.Column('end_date', sa.DateTime),
        sa.Column('notes', sa.String(500)),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Notifications table
    op.create_table('notifications',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('user_id', sa.String(50), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('body', sa.String(1000)),
        sa.Column('message', sa.String(1000)),
        sa.Column('data', postgresql.JSON, default=dict),
        sa.Column('context', postgresql.JSON, default=dict),
        sa.Column('status', sa.String(50), default='unread'),
        sa.Column('read_at', sa.DateTime),
        sa.Column('archived_at', sa.DateTime),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Audit logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('user_id', sa.String(50), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(100)),
        sa.Column('entity_id', sa.String(50)),
        sa.Column('old_values', postgresql.JSON, default=dict),
        sa.Column('new_values', postgresql.JSON, default=dict),
        sa.Column('ip_address', sa.String(50)),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Invites table
    op.create_table('invites',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('invited_by_id', sa.String(50), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255)),
        sa.Column('department', sa.String(255)),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('token', sa.String(255), unique=True, nullable=False),
        sa.Column('expires_at', sa.DateTime, nullable=False),
        sa.Column('accepted_at', sa.DateTime),
        sa.Column('password_hash', sa.String(255)),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Certification alerts table
    op.create_table('certification_alerts',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('employee_id', sa.String(50), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('cert_name', sa.String(255), nullable=False),
        sa.Column('expiry_date', sa.DateTime, nullable=False),
        sa.Column('days_until_expiry', sa.Integer, nullable=False),
        sa.Column('status', sa.String(50), default='active'),
        sa.Column('priority', sa.Integer, default=1),
        sa.Column('notes', sa.String(500)),
        sa.Column('resolved_at', sa.DateTime),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Peak hour risk table
    op.create_table('peak_hour_risk',
        sa.Column('id', sa.String(50), primary_key=True, index=True),
        sa.Column('org_id', sa.String(50), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('date', sa.DateTime, nullable=False),
        sa.Column('hour', sa.Integer, nullable=False),
        sa.Column('risk_score', sa.Integer, nullable=False),
        sa.Column('predicted_staff_shortage', sa.Integer, default=0),
        sa.Column('predicted_burnout_cases', sa.Integer, default=0),
        sa.Column('factors', postgresql.JSON, default=dict),
        sa.Column('recommendations', postgresql.JSON, default=list),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Now that users exists, attach the departments.manager_id FK
    op.create_foreign_key(
        'fk_departments_manager', 'departments', 'users',
        ['manager_id'], ['id'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('peak_hour_risk')
    op.drop_table('certification_alerts')
    op.drop_table('invites')
    op.drop_table('audit_logs')
    op.drop_table('notifications')
    op.drop_table('availability')
    op.drop_table('leave_requests')
    op.drop_table('swap_requests')
    op.drop_table('attendance')
    op.drop_table('shifts')
    op.drop_table('users')
    op.drop_table('leave_policies')
    op.drop_table('departments')
    op.drop_table('organizations')
