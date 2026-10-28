#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Lance cette commande avec sudo : sudo bash scripts/install-nginx.sh"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AVAILABLE="/etc/nginx/sites-available/yassini.frehyy.mg.conf"
ENABLED="/etc/nginx/sites-enabled/yassini.frehyy.mg.conf"

cp "$ROOT/deploy/yassini.frehyy.mg.conf" "$AVAILABLE"
ln -sf "$AVAILABLE" "$ENABLED"
nginx -t
systemctl reload nginx

echo "yassini.frehyy.mg pointe vers http://127.0.0.1:4002"
