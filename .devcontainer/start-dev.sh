#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if lsof -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  exit 0
fi

nohup npm run dev >/tmp/pulse-dev.log 2>&1 &
echo $! >/tmp/pulse-dev.pid
