import pytest
import time
from utils.circuit_breaker import CircuitBreaker, CircuitBreakerOpenError, CircuitState


class TestCircuitBreaker:
    def test_closed_state_on_success(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=0.1)
        def ok(): return "ok"
        assert cb.call(ok) == "ok"
        assert cb.state == CircuitState.CLOSED

    def test_opens_after_threshold(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=60)
        def fail(): raise ValueError("nope")
        for _ in range(3):
            with pytest.raises(ValueError):
                cb.call(fail)
        assert cb.state == CircuitState.OPEN

    def test_rejects_when_open(self):
        cb = CircuitBreaker(failure_threshold=1, recovery_timeout=60)
        def fail(): raise ValueError("nope")
        with pytest.raises(ValueError):
            cb.call(fail)
        assert cb.state == CircuitState.OPEN
        with pytest.raises(CircuitBreakerOpenError):
            cb.call(lambda: "ok")

    def test_half_open_recovery(self):
        cb = CircuitBreaker(failure_threshold=1, recovery_timeout=0.05)
        def fail(): raise ValueError("nope")
        with pytest.raises(ValueError):
            cb.call(fail)
        assert cb.state == CircuitState.OPEN
        time.sleep(0.06)
        assert cb.call(lambda: "recovered") == "recovered"
        assert cb.state == CircuitState.CLOSED

    def test_half_open_limits_calls(self):
        cb = CircuitBreaker(failure_threshold=1, recovery_timeout=0.05, half_open_max_calls=1)
        def fail(): raise ValueError("nope")
        with pytest.raises(ValueError):
            cb.call(fail)
        time.sleep(0.06)
        result = cb.call(lambda: "first")
        assert result == "first"
        assert cb.state == CircuitState.CLOSED

    @pytest.mark.asyncio
    async def test_async_circuit_breaker(self):
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=60)
        async def fail(): raise ValueError("nope")
        with pytest.raises(ValueError):
            await cb.call_async(fail)
        with pytest.raises(ValueError):
            await cb.call_async(fail)
        assert cb.state == CircuitState.OPEN
