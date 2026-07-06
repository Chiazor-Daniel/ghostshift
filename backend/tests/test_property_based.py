from hypothesis import given, settings, strategies as st


class TestPropertyBased:

    @given(
        title=st.text(min_size=1, max_size=100),
        department=st.text(min_size=1, max_size=50),
        start_hour=st.integers(min_value=0, max_value=23),
        duration=st.integers(min_value=1, max_value=24),
    )
    def test_shift_payload_validation(self, title, department, start_hour, duration):
        from routes.shift import CreateShiftPayload
        from pydantic import ValidationError
        try:
            payload = CreateShiftPayload(
                title=title,
                department=department,
                date="2025-01-15",
                start_hour=start_hour,
                duration_hours=duration,
            )
            assert payload.title == title
            assert payload.department == department
        except ValidationError:
            pass

    @given(
        email=st.emails(),
        role=st.sampled_from(["admin", "employee"]),
        status=st.sampled_from(["active", "inactive"]),
    )
    @settings(deadline=1000)
    def test_user_roles_and_status(self, email, role, status):
        from models.user import User
        from middleware.auth import hash_password
        user = User(
            id="prop-test",
            org_id="org-1",
            email=email,
            name="Prop Test",
            role=role,
            password_hash=hash_password("test1234"),
            department="Test",
            status=status,
        )
        assert user.role in ("admin", "employee")
        assert user.status in ("active", "inactive")

    @given(st.text(min_size=1, max_size=200))
    def test_jwt_token_roundtrip(self, user_id):
        from middleware.auth import create_access_token, decode_token
        payload = {"user_id": user_id, "org_id": "org-1", "role": "admin"}
        token = create_access_token(payload)
        decoded = decode_token(token)
        assert decoded["user_id"] == user_id
        assert decoded["org_id"] == "org-1"
        assert decoded["role"] == "admin"

    @given(st.integers(min_value=1, max_value=100))
    def test_retry_success_eventually(self, attempts):
        from utils.retry import retry
        call_count = 0

        @retry(max_attempts=attempts, delay=0.01, backoff=1.0)
        def always_succeeds():
            nonlocal call_count
            call_count += 1
            return 42

        result = always_succeeds()
        assert result == 42
        assert call_count == 1
