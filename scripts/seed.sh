#!/usr/bin/env bash
set -euo pipefail

# Seed demo data into any environment.
# Usage:
#   ./scripts/seed.sh                  # seeds local dev (docker compose)
#   ./scripts/seed.sh --stage          # seeds stage
#   ./scripts/seed.sh --prod BACKEND_URL  # seeds remote prod

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "${1:-}" = "--stage" ]; then
  docker compose -f docker-compose.yml -f docker-compose.stage.yml exec -T backend python seed_demo.py
elif [ "${1:-}" = "--prod" ]; then
  BACKEND_URL="${2?Usage: $0 --prod BACKEND_URL}"
  echo "Seeding $BACKEND_URL ..."
  curl -X POST "$BACKEND_URL/api/seed" -H "Authorization: Bearer $ADMIN_TOKEN"
else
  docker compose exec -T backend python seed_demo.py
fi

echo "Seed complete."
