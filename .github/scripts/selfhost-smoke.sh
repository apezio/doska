#!/usr/bin/env bash
# Smoke-tests a running self-host stack (docker-compose.selfhost.yml). Args pick
# which checks run; no args runs all of them.
#
#   BASE              origin to probe, matching what install.sh writes as
#                     BASE_URL by default    (default http://localhost:8080)
#   EXPECT_BASE_URL   what OAuth discovery should advertise; differs from BASE
#                     whenever something terminates TLS in front (default BASE)
#   HOST_HEADER       Host to send, for vhost-routed deploys (default: none)
#   AUTH_LOGIN/AUTH_PASSWORD  the seeded account the auth check signs in as
#
#   ./.github/scripts/selfhost-smoke.sh
#   BASE=http://127.0.0.1 HOST_HEADER=doska.example.com ./.github/scripts/selfhost-smoke.sh api discovery
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
EXPECT_BASE_URL=${EXPECT_BASE_URL:-$BASE}
HOST_HEADER=${HOST_HEADER:-}
LOGIN=${AUTH_LOGIN:-smoke}
PASSWORD=${AUTH_PASSWORD:-smoke-secret}

CURL=(curl --silent --show-error --fail-with-body --connect-timeout 5 --max-time 20)
if [ -n "$HOST_HEADER" ]; then CURL+=(--header "Host: $HOST_HEADER"); fi

pass() { printf '  ✓ %s\n' "$1"; }
fail() { printf '  ✗ %s\n' "$1" >&2; exit 1; }

# This script only probes a stack, it never starts one. Say so up front rather
# than letting every check fail with a bare connection error.
preflight() {
  local code=0
  "${CURL[@]}" --output /dev/null "$BASE/api/version" 2> /dev/null || code=$?
  case $code in
    7 | 28)
      printf '  ✗ nothing answering at %s — start the stack first:\n' "$BASE" >&2
      printf '      docker compose -f docker-compose.selfhost.yml up -d --wait\n' >&2
      exit 1
      ;;
  esac
}

# Reaching the API through the web container covers nginx's routing too, and
# proves boot finished: migrations run before the port opens.
check_api() {
  local body
  body=$("${CURL[@]}" "$BASE/api/version") || fail "GET /api/version failed"
  case $body in
    *'"version"'*) pass "api: $body" ;;
    *) fail "unexpected /api/version body: $body" ;;
  esac
}

check_web() {
  local body
  body=$("${CURL[@]}" "$BASE/") || fail "GET / failed"
  case $body in
    *'<div id="root">'*) pass "web: app shell served" ;;
    *) fail "GET / returned something other than the app shell" ;;
  esac
}

# Inferring the origin from proxy headers instead sends MCP clients to the wrong
# scheme or host — cookie auth survives that, so nothing else notices.
check_discovery() {
  local path body
  for path in /.well-known/oauth-authorization-server \
    /.well-known/oauth-protected-resource; do
    body=$("${CURL[@]}" "$BASE$path") || fail "GET $path failed"
    case $body in
      *"$EXPECT_BASE_URL"*) pass "discovery: $path advertises $EXPECT_BASE_URL" ;;
      *) fail "$path does not advertise $EXPECT_BASE_URL (set EXPECT_BASE_URL to the server's own BASE_URL if it differs from $BASE): $body" ;;
    esac
  done
}

# AUTH_LOGIN/AUTH_PASSWORD seed the single account on boot, so this exercises the
# seed, the database and the session cookie at once.
check_auth() {
  local jar body
  jar=$(mktemp)
  trap 'rm -f "$jar"' RETURN

  "${CURL[@]}" --cookie-jar "$jar" --header 'Content-Type: application/json' \
    --data "$(printf '{"username":"%s","password":"%s"}' "$LOGIN" "$PASSWORD")" \
    "$BASE/api/auth/sign-in/username" > /dev/null ||
    fail "sign-in as $LOGIN failed — the account is seeded only while the user
    table is empty, so a database volume older than this .env keeps whatever
    credentials it was first seeded with"

  body=$("${CURL[@]}" --cookie "$jar" "$BASE/api/auth/get-session") ||
    fail "GET /api/auth/get-session failed"
  case $body in
    *"$LOGIN"*) pass "auth: signed in as $LOGIN, session reads back" ;;
    *) fail "session does not belong to $LOGIN: $body" ;;
  esac
}

checks=("$@")
if [ ${#checks[@]} -eq 0 ]; then checks=(api web discovery auth); fi

printf 'smoke: %s (expecting base url %s)\n' "$BASE" "$EXPECT_BASE_URL"
preflight
for name in "${checks[@]}"; do
  case $name in
    api | web | discovery | auth) "check_$name" ;;
    *) fail "unknown check: $name" ;;
  esac
done
