class TestFHIR:
    def test_list_metrics(self, client):
        response = client.get("/api/fhir/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data
        assert "heart_rate" in data["metrics"]

    def test_get_patient_not_found(self, client):
        response = client.get("/api/fhir/Patient/patient-99999")
        assert response.status_code == 404

    def test_get_patient_success(self, client, db_session):
        from models.user import User
        from middleware.auth import hash_password
        user = User(
            id="fhir-patient-1",
            org_id="org-test-1",
            email="fhirpatient@test.com",
            full_name="FHIR Patient",
            role="employee",
            password_hash=hash_password("test1234"),
            department="ICU",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        response = client.get("/api/fhir/Patient/fhir-patient-1")
        assert response.status_code == 200
        data = response.json()
        assert data["resourceType"] == "Patient"
        assert data["id"] == "patient-fhir-patient-1"

    def test_get_observation_invalid_id(self, client):
        response = client.get("/api/fhir/Observation/invalid")
        assert response.status_code == 400

    def test_patient_everything_not_found(self, client):
        response = client.get("/api/fhir/Patient/patient-99999/$everything")
        assert response.status_code == 404

    def test_patient_observations(self, client, db_session):
        from models.user import User
        from middleware.auth import hash_password
        user = User(
            id="fhir-obs-1",
            org_id="org-test-1",
            email="fhirobs@test.com",
            full_name="FHIR Obs",
            role="employee",
            password_hash=hash_password("test1234"),
            department="ICU",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        response = client.get("/api/fhir/Patient/fhir-obs-1/observations")
        assert response.status_code == 200
        data = response.json()
        assert data["resourceType"] == "Bundle"
        assert data["total"] > 0

    def test_patient_observations_filtered(self, client, db_session):
        from models.user import User
        from middleware.auth import hash_password
        user = User(
            id="fhir-filter-1",
            org_id="org-test-1",
            email="fhirfilter@test.com",
            full_name="FHIR Filter",
            role="employee",
            password_hash=hash_password("test1234"),
            department="ICU",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        response = client.get("/api/fhir/Patient/fhir-filter-1/observations?metric=heart_rate")
        assert response.status_code == 200
        data = response.json()
        for entry in data["entry"]:
            code = entry["resource"]["code"]["coding"][0]
            assert code["display"] == "Heart rate"

    def test_patient_everything_success(self, client, db_session):
        from models.user import User
        from middleware.auth import hash_password
        user = User(
            id="fhir-everything-1",
            org_id="org-test-1",
            email="fhireverything@test.com",
            full_name="FHIR Everything",
            role="employee",
            password_hash=hash_password("test1234"),
            department="ICU",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        response = client.get("/api/fhir/Patient/fhir-everything-1/$everything")
        assert response.status_code == 200
        data = response.json()
        assert data["resourceType"] == "Bundle"
        assert data["type"] == "searchset"
        assert len(data["entry"]) > 1
