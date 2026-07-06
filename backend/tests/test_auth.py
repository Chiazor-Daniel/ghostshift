import pytest


class TestAuth:
    def test_login_missing_credentials(self, client):
        response = client.post("/api/auth/login", json={})
        assert response.status_code == 422

    def test_login_invalid_email(self, client):
        response = client.post("/api/auth/login", json={"email": "notanemail", "password": "test1234"})
        assert response.status_code == 422

    def test_login_wrong_password(self, client, db_session):
        from models.user import User
        from middleware.auth import hash_password
        user = User(
            id="auth-test-1",
            org_id="org-test-1",
            email="logintest@test.com",
            name="Login Test",
            role="employee",
            password_hash=hash_password("correctpassword"),
            department="ICU",
            status="active",
        )
        db_session.add(user)
        db_session.commit()

        response = client.post("/api/auth/login", json={
            "email": "logintest@test.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    def test_login_success(self, client, db_session):
        from models.user import User
        from middleware.auth import hash_password
        user = User(
            id="auth-test-2",
            org_id="org-test-1",
            email="success@test.com",
            name="Success Test",
            role="employee",
            password_hash=hash_password("password123"),
            department="ICU",
            status="active",
        )
        db_session.add(user)
        db_session.commit()

        response = client.post("/api/auth/login", json={
            "email": "success@test.com",
            "password": "password123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "success@test.com"

    def test_register_validation(self, client):
        response = client.post("/api/auth/register", json={})
        assert response.status_code == 422

    def test_register_short_password(self, client):
        response = client.post("/api/auth/register", json={
            "email": "new@test.com",
            "password": "short",
            "name": "New User",
        })
        assert response.status_code == 422

    def test_unauthenticated_access(self, client):
        response = client.get("/api/shifts/")
        assert response.status_code == 401

    def test_unauthorized_admin_access(self, client, employee_headers):
        response = client.get("/api/employees/", headers=employee_headers)
        assert response.status_code == 403
