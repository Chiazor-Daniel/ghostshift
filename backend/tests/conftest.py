import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["JWT_SECRET"] = "test-secret-key-32-chars-minimum!!!!"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
os.environ["DEBUG"] = "false"
os.environ["LOG_LEVEL"] = "CRITICAL"
os.environ["SEED_DEMO"] = "false"
os.environ["RATE_LIMIT_MAX"] = "10000"
os.environ["RATE_LIMIT_WINDOW"] = "60"

from config.database import Base, get_db
from main import app
from config.logging import setup_logging
setup_logging()


@pytest.fixture
def db_session():
    engine = create_engine("sqlite://", echo=False, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    from models import user, organization, shift, swap, leave, availability, notification, audit, invite, attendance, cert_alert, peak_risk
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def override_get_db(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass
    return _override_get_db


@pytest.fixture
def client(override_get_db):
    from fastapi.testclient import TestClient
    app.dependency_overrides.clear()
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(db_session):
    from models.user import User
    from middleware.auth import hash_password, create_access_token

    admin = User(
        id="admin-test-1",
        org_id="org-test-1",
        email="admin@test.com",
        name="Test Admin",
        role="admin",
        password_hash=hash_password("password123"),
        department="Emergency",
        status="active",
    )
    db_session.add(admin)
    db_session.commit()
    token = create_access_token({"user_id": admin.id, "org_id": admin.org_id, "role": "admin", "email": admin.email})
    return token, admin


@pytest.fixture
def employee_token(db_session):
    from models.user import User
    from middleware.auth import hash_password, create_access_token

    emp = User(
        id="emp-test-1",
        org_id="org-test-1",
        email="emp@test.com",
        name="Test Employee",
        role="employee",
        password_hash=hash_password("password123"),
        department="Emergency",
        status="active",
    )
    db_session.add(emp)
    db_session.commit()
    token = create_access_token({"user_id": emp.id, "org_id": emp.org_id, "role": "employee", "email": emp.email})
    return token, emp


@pytest.fixture
def auth_headers(admin_token):
    token, _ = admin_token
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def employee_headers(employee_token):
    token, _ = employee_token
    return {"Authorization": f"Bearer {token}"}
