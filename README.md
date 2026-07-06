# GhostShift

A workforce scheduling web application with interactive d3.js data visualization.

Built for the INCO course — Innovation and Complexity Management.

## Architecture

```
frontend/  →  React + d3.js (Vite dev server on :5173)
backend/   →  FastAPI + PostgreSQL (uvicorn on :8000)
            - REST API with JWT auth
            - Structured JSON logging (structlog)
            - Rate limiting, circuit breaker, retry utilities
```

## Quick Start

```bash
# 1. Clone and enter the repo
git clone <repo-url>
cd GhostShift

# 2. Start everything with Docker
docker compose up -d

# 3. Open the app
#    Frontend: http://localhost:5173
#    API docs: http://localhost:8000/docs
```

That's it. Docker Compose runs Postgres, Redis, the backend API, and the frontend dev server.

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

All tests use an isolated in-memory SQLite database — no external services needed.

### What's Tested

| Module | Tests | Covers |
|---|---|---|
| Auth | 8 | login, registration, permissions, JWT |
| Shifts | 8 | CRUD, assign, check-in/out, validation |
| Health | 5 | health check, docs, schema |
| Circuit Breaker | 6 | state machine, recovery, async |
| Rate Limiting | 2 | normal flow, exceeded threshold |
| Property-based | 4 | hypothesis tests for payloads, tokens, retry |

**36 tests total.**

## Environment

Copy the example config and adjust if needed:

```bash
cp backend/.env.example backend/.env
```

The defaults work with Docker Compose out of the box.

## Key Features

- **JWT Authentication** — role-based access (admin / employee)
- **Structured Logging** — JSON output with correlation IDs
- **Input Validation** — Pydantic models on all endpoints
- **Error Handling** — typed exceptions, centralized handler
- **Fault Tolerance** — retry with backoff, circuit breaker, rate limiter
- **CI Pipeline** — lint (ruff, ESLint) + test (pytest, hypothesis)


