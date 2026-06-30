# GhostShift

Healthcare shift-swap and burnout-intelligence platform.

The repo has two parts:

- `backend/` — FastAPI service (auth, rota, swaps, fatigue scoring, AI assistant)
- `frontend/` — React + Vite marketing site and authenticated app

## Quick start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Open .env and set DATABASE_URL, JWT_SECRET, CORS_ORIGINS, GROQ_API_KEY at minimum.

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API is then available at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

On first boot, `Base.metadata.create_all` runs and creates all tables. No manual migration is needed for development.

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Defaults to http://localhost:8000/api — change if your backend is elsewhere.

npm run dev          # development on http://localhost:5173
npm run build        # production bundle in dist/
```

## Repository layout

```
.
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── config/                  # env loader, DB, settings
│   ├── models/                  # SQLAlchemy models
│   ├── routes/                  # API endpoints (auth, shifts, swaps, leave, ...)
│   ├── schemas/                 # Pydantic request/response shapes
│   ├── ai_ml/                   # burnout scoring + AI assistant
│   ├── middleware/              # JWT auth
│   ├── utils/                   # email, helpers
│   ├── migrations/              # Alembic (optional — create_all handles first boot)
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # marketing + authenticated routes
│   │   ├── components/
│   │   ├── services/            # API client (realAPI.js)
│   │   ├── hooks/
│   │   ├── data/
│   │   └── lib/
│   ├── public/
│   ├── dist/                    # build output (committed for static deploy)
│   ├── index.html
│   ├── package.json
│   └── .env.example
│
└── README.md
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

## Deployment

- **Backend** is packaged via `backend/Dockerfile` (Python 3.12 slim, healthcheck on `/health`). The image reads env at runtime — nothing is baked in.
- **Frontend** is a Vite static build. `cd frontend && npm run build` produces `frontend/dist/`, which can be served from any static host (Netlify, Vercel, S3 + CloudFront, Nginx).

## Tech stack

**Backend:** FastAPI, SQLAlchemy, Pydantic, Alembic, LightGBM (burnout scoring), OpenAI Python SDK (Groq-compatible), python-jose, passlib.

**Frontend:** React 18, Vite, Tailwind CSS, framer-motion, react-router-dom, recharts, date-fns.

## License

Private — all rights reserved.