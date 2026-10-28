#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" != "--no-git" ]]; then
  git fetch origin main
  git checkout main
  git pull --ff-only origin main
fi

docker compose build
docker compose up -d --remove-orphans
docker image prune -f
