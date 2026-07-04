# GhostShift

Healthcare shift-swap and burnout-intelligence platform.

The repo has two parts:

- `backend/` — FastAPI service (auth, rota, swaps, fatigue scoring, AI assistant)
- `frontend/` — React + Vite marketing site and authenticated app

## Quick start (Docker)

```bash
git clone <repo-url> && cd GhostShift

# (optional) Copy example env to get API keys for AI and email features
cp backend/.env.example backend/.env

# Start everything
docker compose up -d

# Open http://localhost:5173
```

No `.env` is required — Docker Compose sets DB, Redis, CORS, and JWT
automatically. If you do copy `backend/.env.example`, those values are
loaded too but never override the Docker-specific ones.

First build takes a couple minutes (pip + npm install). Subsequent starts are instant.

On first boot the backend auto-runs migrations and seeds demo data — the app is ready when you see `Uvicorn running on http://0.0.0.0:8000` in the logs (`docker compose logs -f backend`).

| Service        | URL                          |
|----------------|------------------------------|
| Frontend (Vite)| http://localhost:5173        |
| API docs       | http://localhost:8000/docs   |
| Captured email | http://localhost:8025        |

### Manual commands

```bash
docker compose logs -f      # tail all logs
docker compose logs -f backend  # tail just backend logs
docker compose down         # stop everything
docker compose restart backend  # restart backend only
```

## Quick start (no Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Open .env and set DATABASE_URL, JWT_SECRET, CORS_ORIGINS at minimum.

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env

npm run dev          # http://localhost:5173
npm run build        # production bundle in dist/
```

## Environments

| Environment | Where | How |
|---|---|---|
| **Dev** (local) | Your machine | `docker compose up -d` |
| **Stage** | GitHub Codespaces | `docker compose -f docker-compose.yml -f docker-compose.stage.yml up -d` |
| **Live** | AWS | CI/CD via GitHub Actions → ECS Fargate + S3/CloudFront |

See `DEPLOYMENT_STRATEGY.md` for the full architecture and CI/CD pipeline.

## Repository layout

```
.
├── backend/                     # FastAPI Python backend
│   ├── main.py
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── ai_ml/
│   ├── middleware/
│   ├── utils/
│   ├── migrations/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── data/
│   │   └── lib/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── infra/                       # Production infrastructure
│   ├── nginx/nginx.conf
│   └── aws/
│       ├── ecs-task-definition-backend.json
│       └── ecs-task-definition-celery.json
│
├── .github/workflows/
│   ├── ci.yml                   # Lint, test, build on PR/push
│   └── deploy.yml               # Build & deploy to AWS on main push
│
├── scripts/
│   ├── dev.sh                   # One-command dev bootstrap
│   └── seed.sh                  # Seed demo data helper
│
├── docker-compose.yml           # Dev environment
├── docker-compose.stage.yml     # Codespaces overlay
├── docker-compose.prod.yml      # Production-like local stack
└── DEPLOYMENT_STRATEGY.md       # Architecture & deployment docs
```

## Environment variables

The backend reads from `backend/.env` (loaded via `python-dotenv` at import time).

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. `postgresql://user:pass@host:5432/dbname?sslmode=require` for hosted Postgres (Neon, Supabase). |
| `JWT_SECRET` | Yes | Long random string used to sign auth tokens. Generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. |
| `CORS_ORIGINS` | Yes | Comma-separated list of frontend origins allowed to call the API. Local: `http://localhost:5173`. |
| `GROQ_API_KEY` | For AI features | Powers the in-app assistant. Get one at https://console.groq.com. |
| `GROQ_MODEL` | Optional | Defaults to `llama-3.3-70b-versatile`. |
| `SMTP_USER`, `SMTP_PASSWORD` | For email invites | Mailtrap credentials (sandbox used by default in `utils/email.py`). |
| `PORT` | Optional | Set by the host (Render, Fly, Railway). Defaults to 8000 locally. |

The full list of optional variables (AWS S3, rate limits, file upload limits, etc.) is in `backend/.env.example`.

## Tech stack

**Backend:** FastAPI, SQLAlchemy, Pydantic, Alembic, LightGBM (burnout scoring), OpenAI Python SDK (Groq-compatible), python-jose, passlib.

**Frontend:** React 18, Vite, Tailwind CSS, framer-motion, react-router-dom, recharts, date-fns.

## License

Private — all rights reserved.