"""
Database Configuration
PostgreSQL connection and session management
"""

import os

from config.env import load_env
load_env()

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL from environment (Render provides DATABASE_URL).
# Refuse to fall back to a local-only default in production.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Configure it in the environment, e.g. "
        "postgresql://user:pass@host:5432/dbname"
    )

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)


@event.listens_for(engine, "connect")
def set_timezone(dbapi_connection, connection_record):
    if engine.dialect.name == "postgresql":
        cursor = dbapi_connection.cursor()
        cursor.execute("SET timezone TO 'UTC'")
        cursor.close()

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from models import user, organization, shift, swap, leave, availability, notification, audit, invite, attendance, cert_alert, peak_risk
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully")
