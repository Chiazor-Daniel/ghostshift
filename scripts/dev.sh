#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=== GhostShift Dev Environment ==="

# Create required directories
mkdir -p logs

# Start all services
echo "Starting services..."
docker compose up -d

# Wait for backend to be healthy
echo "Waiting for backend to be ready..."
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
  sleep 2
done
echo "Backend is healthy!"

# Run migrations
echo "Running database migrations..."
docker compose exec -T backend alembic upgrade head

# Seed demo data
echo "Seeding demo data..."
docker compose exec -T backend python seed_demo.py

echo "=== Dev environment ready! ==="
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo "  Mailpit:  http://localhost:8025"
echo ""
echo "Run 'docker compose logs -f' to tail logs."
echo "Run 'docker compose down' to stop."
