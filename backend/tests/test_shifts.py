from datetime import datetime, timezone


class TestShifts:
    def test_create_shift_validation(self, client, auth_headers):
        response = client.post("/api/shifts/", json={}, headers=auth_headers)
        assert response.status_code == 422

    def test_create_shift_missing_fields(self, client, auth_headers):
        response = client.post("/api/shifts/", json={
            "title": "Test Shift",
        }, headers=auth_headers)
        assert response.status_code == 422

    def test_create_shift_success(self, client, auth_headers):
        response = client.post("/api/shifts/", json={
            "title": "Morning Shift",
            "department": "Emergency",
            "date": "2025-01-15",
            "start_hour": 8,
            "duration_hours": 8,
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Morning Shift"
        assert data["department"] == "Emergency"
        assert data["status"] == "open"

    def test_list_shifts(self, client, auth_headers):
        client.post("/api/shifts/", json={
            "title": "Shift A",
            "department": "Emergency",
            "date": "2025-01-15",
            "start_hour": 8,
        }, headers=auth_headers)
        response = client.get("/api/shifts/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0

    def test_get_shift_not_found(self, client, auth_headers):
        response = client.get("/api/shifts/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404

    def test_create_shift_unauthorized(self, client, employee_headers):
        response = client.post("/api/shifts/", json={
            "title": "Test",
            "department": "Emergency",
            "date": "2025-01-15",
        }, headers=employee_headers)
        assert response.status_code == 403

    def test_assign_shift(self, client, auth_headers, db_session):
        from models.user import User
        from middleware.auth import hash_password
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

        shift_resp = client.post("/api/shifts/", json={
            "title": "Assignable Shift",
            "department": "Emergency",
            "date": "2025-01-15",
            "start_hour": 8,
        }, headers=auth_headers)
        shift_id = shift_resp.json()["id"]

        response = client.post(
            f"/api/shifts/{shift_id}/assign",
            json={"employee_id": "emp-test-1"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["employee_id"] == "emp-test-1"

    def test_check_in_out_flow(self, client, employee_headers, auth_headers, db_session):
        from models.user import User
        from middleware.auth import create_access_token
        emp = User(
            id="checkin-test-1",
            org_id="org-test-1",
            email="checkin@test.com",
            name="Checkin Test",
            role="employee",
            password_hash="skip",
            department="Emergency",
            status="active",
        )
        db_session.add(emp)
        db_session.commit()
        token = create_access_token({"user_id": emp.id, "org_id": emp.org_id, "role": "employee", "email": emp.email})
        emp_headers = {"Authorization": f"Bearer {token}"}
        shift_resp = client.post("/api/shifts/", json={
            "title": "Checkin Shift",
            "department": "Emergency",
            "date": "2025-01-15",
            "start_hour": 8,
            "employee_id": "checkin-test-1",
            "assigned_staff": ["checkin-test-1"],
        }, headers=auth_headers)
        shift_id = shift_resp.json()["id"]

        checkin = client.post(f"/api/shifts/{shift_id}/check-in", json={}, headers=emp_headers)
        assert checkin.status_code == 200
        assert checkin.json()["check_in_at"] is not None

        checkout = client.post(f"/api/shifts/{shift_id}/check-out", json={}, headers=emp_headers)
        assert checkout.status_code == 200
        assert checkout.json()["status"] == "completed"

    def test_delete_shift(self, client, auth_headers):
        shift_resp = client.post("/api/shifts/", json={
            "title": "Deletable Shift",
            "department": "Emergency",
            "date": "2025-01-15",
        }, headers=auth_headers)
        shift_id = shift_resp.json()["id"]

        response = client.delete(f"/api/shifts/{shift_id}", headers=auth_headers)
        assert response.status_code == 200

        get_resp = client.get(f"/api/shifts/{shift_id}", headers=auth_headers)
        assert get_resp.status_code == 404
