#!/usr/bin/env bash
# Local dev launcher for this box, which also runs the live doska-server.service
# (port 3000, `doska` database). Upstream `pnpm dev` collides with it: its server
# task hardcodes DATABASE_URL=...:5432/postgres and starts a PGlite server on
# 5432, which the system Postgres already owns.
#
# This runs the API on 3001 against the separate `doska_dev` database, and points
# the client proxy at it via RPC_TARGET. Config lives in apps/server/.env.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

API_PORT="${API_PORT:-3001}"
CLIENT_PORT="${CLIENT_PORT:-5173}"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null
nvm use >/dev/null 2>&1 || true

node_major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$node_major" -lt 22 ]; then
  echo "error: need Node >=22, got $(node -v 2>/dev/null || echo none). Run: nvm install 22" >&2
  exit 1
fi

if [ ! -f apps/server/.env ]; then
  echo "error: apps/server/.env missing (needs DATABASE_URL, AUTH_SECRET, PORT)." >&2
  exit 1
fi

for port in "$API_PORT" "$CLIENT_PORT"; do
  if ss -ltn "sport = :$port" 2>/dev/null | grep -q LISTEN; then
    echo "error: port $port already in use." >&2
    exit 1
  fi
done

pids=()
cleanup() {
  trap - INT TERM EXIT
  [ ${#pids[@]} -gt 0 ] && kill "${pids[@]}" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "api    -> http://localhost:$API_PORT  (db: doska_dev)"
echo "client -> http://localhost:$CLIENT_PORT"
echo "live doska-server.service on :3000 is left alone."
echo

( cd apps/server && PORT="$API_PORT" exec pnpm exec tsx watch --env-file-if-exists=.env src/index.ts ) 2>&1 | sed -u 's/^/[api] /' &
pids+=($!)

( cd apps/client && RPC_TARGET="http://localhost:$API_PORT" exec pnpm exec vite --port "$CLIENT_PORT" --strictPort ) 2>&1 | sed -u 's/^/[client] /' &
pids+=($!)

wait -n
echo "one process exited; shutting down the other." >&2
