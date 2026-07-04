# GhostShift — Deployment & CI Strategy

## 1. Cloud Service Provider: **AWS**

**Why AWS:**
| Service | GhostShift Need | AWS Offering |
|---|---|---|
| PostgreSQL | Primary database | RDS PostgreSQL (Multi-AZ, automated backups, encryption at rest) |
| Redis | Celery broker + cache | ElastiCache for Redis (cluster mode, auto-failover) |
| Docker containers | Backend API + Celery workers | ECS Fargate (serverless containers, no EC2 management) |
| Object storage | File uploads (avatars, exports) | S3 (with server-side encryption for HIPAA) |
| CDN | Frontend static assets | CloudFront (edge caching, HTTPS, custom domain) |
| Container registry | Docker image storage | ECR (integrated with ECS, IAM-controlled) |
| Secrets | Environment variables, DB creds | Secrets Manager (rotation, audit) |
| Domain & DNS | Custom domain | Route 53 |
| Email | Password reset, invites | Amazon SES (or keep Mailtrap for dev, SES for prod) |
| Monitoring | Logs, metrics, alerts | CloudWatch + X-Ray |

**Estimated monthly cost (production):** ~$150–$400 depending on scale.

---

## 2. System Architecture

```
                         ┌─────────────────────────────┐
                         │     CloudFront CDN           │
                         │  (frontend.ghostshift.com)   │
                         └──────────┬──────────────────┘
                                    │
                         ┌──────────▼──────────────────┐
                         │    S3 Bucket (SPA build)     │
                         └─────────────────────────────┘

  ┌─────────────┐       ┌──────────────┐       ┌──────────────┐
  │  Client App  │──────►│  ALB (HTTPS) │──────►│  ECS Fargate  │
  │ (React SPA)  │       │  (api.ghost- │       │  Backend API  │
  │              │       │   shift.com) │       │  (FastAPI)    │
  └─────────────┘       └──────────────┘       └──────┬───────┘
        │ ▲                                           │
        │ │ WebSocket                                 │
        │ └───────────────────────────────────────────┤
        │                                             │
        │                              ┌──────────────▼────────┐
        │                              │   ECS Fargate          │
        │                              │   Celery Workers       │
        │                              └──────────────┬────────┘
        │                                             │
        │                    ┌────────────────────────┼────────────┐
        │                    │                        │            │
        │           ┌────────▼──────┐       ┌────────▼──────┐    │
        │           │ RDS PostgreSQL│       │  ElastiCache   │    │
        │           │  (Primary DB) │       │  Redis         │    │
        │           └───────────────┘       └───────────────┘    │
        │                                             ▲          │
        │                                             │          │
        │      ┌──────────────────────────────────────┘          │
        │      │  AWS Secrets Manager                             │
        │      │  (JWT_SECRET, DB_URL, API keys)                  │
        │      └─────────────────────────────────────────────────┘
        │
        └──────► S3 (file uploads, exports)
```

**Container strategy:** Docker throughout — same image runs everywhere (dev, stage, prod) with different config via environment variables.

---

## 3. Dependency Management

| Layer | Manager | File | Notes |
|---|---|---|---|
| Python (backend) | `pip` | `backend/requirements.txt` | Pin exact versions |
| Node (frontend) | `npm` | `frontend/package.json` + lockfile | Keep `package-lock.json` in VCS |
| Docker images | `Dockerfile` | `backend/Dockerfile` | Single image for API + workers (different CMD) |
| Infrastructure | Terraform (future) | `infra/terraform/` | Not included in initial rollout |

---

## 4. Service Orchestration

| Environment | Orchestrator | Notes |
|---|---|---|
| **Dev** (local) | Docker Compose | Hot-reload backend + frontend, local Postgres + Redis |
| **Stage** (Codespaces) | Docker Compose | Same as dev but with Codespaces URL forwarding |
| **Live** (production) | AWS ECS Fargate | Managed container orchestration, auto-scaling |

---

## 5. Environment Matrix

| Aspect | Dev (local) | Stage (Codespaces) | Live (production) |
|---|---|---|---|
| Backend | `uvicorn --reload` | `uvicorn --reload` | ECS Fargate (multi-container) |
| Frontend | `vite dev` (HMR) | `vite dev` (HMR) | Static build → S3 + CloudFront |
| Database | Docker Postgres 16 | Docker Postgres 16 | RDS PostgreSQL (Multi-AZ) |
| Redis | Docker Redis 7 | Docker Redis 7 | ElastiCache Redis |
| Celery | Docker container | Docker container | ECS Fargate worker tasks |
| File storage | Local volume | Local volume | S3 |
| Email | Console / Mailtrap | Mailtrap | Amazon SES |
| Domain | `localhost` | `*.apps.codespaces` | `app.ghostshift.com` |
| HTTPS | None (self-signed) | Automatic (Codespaces) | ACM + CloudFront + ALB |
| Data | Seeded demo data | Seeded demo data | Production data (migrated) |

---

## 6. CI/CD Pipeline (GitHub Actions)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Lint    │───►│  Test    │───►│  Build   │───►│  Push    │───►│  Deploy  │
│ (ruff)   │    │(pytest)  │    │(Docker)  │    │(ECR)     │    │(ECS)     │
│ (ESLint) │    │(vitest)  │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                                    │
                                          ┌─────────────────────────┼──────┐
                                          │                         │      │
                                    ┌─────▼─────┐          ┌───────▼──────┐
                                    │   Stage    │          │  Production  │
                                    │ (manual)   │          │  (auto on    │
                                    │            │          │  main)       │
                                    └────────────┘          └──────────────┘
```

- **On PR:** Lint + test (parallel), build Docker image
- **On push to `main`:** Lint + test → build + push → deploy to production
- **Manual trigger:** Deploy to stage for pre-release verification

---

## 7. Quick Start

### Dev (local)
```bash
# Start all services
docker compose up -d

# Run database migrations
docker compose exec backend alembic upgrade head

# Seed demo data
docker compose exec backend python seed_demo.py

# Open http://localhost:5173
```

### Stage (GitHub Codespaces)
```bash
# Start with stage profile
docker compose -f docker-compose.yml -f docker-compose.stage.yml up -d

# The terminal will show the forwarded URLs
```

### Production deploy
```bash
# Trigger via GitHub Actions
# Or manually:
aws ecs update-service --cluster ghostshift --service backend --force-new-deployment
```
