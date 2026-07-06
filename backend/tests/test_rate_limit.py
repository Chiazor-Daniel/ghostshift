from middleware.rate_limit import RateLimitMiddleware
from starlette.applications import Starlette
from starlette.responses import PlainTextResponse
from starlette.routing import Route
from starlette.testclient import TestClient


class TestRateLimit:
    def test_rate_limit_allows_normal_requests(self):
        async def ok(request): return PlainTextResponse("ok")
        app = Starlette(routes=[Route("/", endpoint=ok)])
        app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)
        client = TestClient(app)
        for _ in range(10):
            resp = client.get("/")
            assert resp.status_code == 200

    def test_rate_limit_exceeded(self):
        async def ok(request): return PlainTextResponse("ok")
        app = Starlette(routes=[Route("/", endpoint=ok)])
        app.add_middleware(RateLimitMiddleware, max_requests=5, window_seconds=60)
        client = TestClient(app)
        for _ in range(5):
            resp = client.get("/")
            assert resp.status_code == 200
        resp = client.get("/")
        assert resp.status_code == 429
        data = resp.json()
        assert "rate_limited" in data.get("code", "")
