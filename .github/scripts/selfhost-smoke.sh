#!/usr/bin/env bash
# Smoke-tests a running self-host stack (docker-compose.selfhost.yml). CI runs
# this after `up --wait`, but it works against any deploy — point BASE at it.
#
#   BASE              origin to probe          (default http://127.0.0.1:8080)
#   EXPECT_BASE_URL   what OAuth discovery should advertise; differs from BASE
#                     whenever something terminates TLS in front (default BASE)
#   HOST_HEADER       Host to send, for vhost-routed deploys (default: none)
#   AUTH_LOGIN/AUTH_PASSWORD  the seeded account the auth check signs in as
#
# Args pick which checks run; no args runs all of them.
#
#   ./.github/scripts/selfhost-smoke.sh
#   BASE=http://127.0.0.1 HOST_HEADER=doska.example.com ./.github/scripts/selfhost-smoke.sh api discovery
set -euo pipefail

BASE=${BASE:-http://127.0.0.1:8080}
EXPECT_BASE_URL=${EXPECT_BASE_URL:-$BASE}
HOST_HEADER=${HOST_HEADER:-}
LOGIN=${AUTH_LOGIN:-smoke}
PASSWORD=${AUTH_PASSWORD:-smoke-secret}

CURL=(curl --silent --show-error --fail-with-body --max-time 20)
if [ -n "$HOST_HEADER" ]; then CURL+=(--header "Host: $HOST_HEADER"); fi

pass() { printf '  ✓ %s\n' "$1"; }
fail() { printf '  ✗ %s\n' "$1" >&2; exit 1; }

# The API is only reachable through the web container's /api proxy, so this
# covers nginx's routing as much as the server. It also proves boot finished:
# migrations run before the port opens.
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

# Discovery has to advertise the configured BASE_URL. Fall back to inferring it
# from proxy headers and MCP clients get sent to the wrong scheme or host —
# cookie auth survives that, so nothing else in the stack notices.
check_discovery() {
  local path body
  for path in /.well-known/oauth-authorization-server \
    /.well-known/oauth-protected-resource; do
    body=$("${CURL[@]}" "$BASE$path") || fail "GET $path failed"
    case $body in
      *"$EXPECT_BASE_URL"*) pass "discovery: $path advertises $EXPECT_BASE_URL" ;;
      *) fail "$path does not advertise $EXPECT_BASE_URL: $body" ;;
    esac
  done
}

# AUTH_LOGIN/AUTH_PASSWORD seed the single account on boot. Signing in with them
# and reading the session back exercises the seed, the database and the cookie.
check_auth() {
  local jar body
  jar=$(mktemp)
  trap 'rm -f "$jar"' RETURN

  "${CURL[@]}" --cookie-jar "$jar" --header 'Content-Type: application/json' \
    --data "$(printf '{"username":"%s","password":"%s"}' "$LOGIN" "$PASSWORD")" \
    "$BASE/api/auth/sign-in/username" > /dev/null ||
    fail "sign-in as $LOGIN failed"

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
for name in "${checks[@]}"; do
  case $name in
    api | web | discovery | auth) "check_$name" ;;
    *) fail "unknown check: $name" ;;
  esac
done
