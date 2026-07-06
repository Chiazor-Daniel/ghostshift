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

## Environment

Copy the example config and adjust if needed:

```bash
cp backend/.env.example backend/.env
```

The defaults work with Docker Compose out of the box.

## Key Features

- **Shift Marketplace** — browse, swap, and pick up open shifts with one click
- **AI-Powered Insights** — burnout risk detection, coverage analysis, scheduling recommendations
- **Role-Based Dashboards** — tailored views for admins, managers, and employees
- **Smart Scheduling** — auto-conflict detection, availability matching, fair hour distribution
- **Real-Time Notifications** — instant alerts for swaps, approvals, and urgent coverage gaps


