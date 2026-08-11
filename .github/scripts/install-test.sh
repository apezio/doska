#!/usr/bin/env bash
# Exercises install.sh's setup path unattended, asserting what lands in .env.
#
#   ./.github/scripts/install-test.sh
set -uo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/../.." && pwd)
INSTALL="$REPO_ROOT/install.sh"
COMPOSE_SRC="$REPO_ROOT/docker-compose.selfhost.yml"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# Stub docker: these cases are about what install.sh writes, and `docker volume
# ls` against a sick daemon never returns. Its log is how --no-start is checked.
mkdir -p "$WORK/bin"
cat > "$WORK/bin/docker" <<'STUB'
#!/bin/sh
echo "$*" >> "${DOCKER_LOG:-/dev/null}"
case "$1 ${2:-}" in
  "compose version")
    [ -z "${DOCKER_STUB_NO_COMPOSE:-}" ] || exit 1
    echo "Docker Compose version v2.40.0"
    ;;
  "volume ls")
    # Stands in for a daemon that accepted the call and never answered.
    [ -z "${DOCKER_STUB_HANG:-}" ] || sleep 120
    ;; # otherwise empty: a host with no previous install
esac
exit 0
STUB
chmod +x "$WORK/bin/docker"

failures=0
case_name=""

# A question that slips through unattended would block forever.
CASE_TIMEOUT=${CASE_TIMEOUT:-45}

pass() { printf '  ✓ %s\n' "$1"; }
fail() {
  printf '  ✗ %s: %s\n' "$case_name" "$1" >&2
  failures=$((failures + 1))
}
step() { printf '  · %s\n' "$1"; }

# run <dir> [env assignments...] -- [install.sh args...]
run() {
  local dir="$WORK/$1"; shift
  local envs=() args=()
  while [ $# -gt 0 ]; do
    case $1 in
      --) shift; args=("$@"); break ;;
      *) envs+=("$1"); shift ;;
    esac
  done
  mkdir -p "$dir"
  # backup.sh is only fetched when absent, so this keeps that download offline.
  # The compose file is refreshed on every run, so it comes from CASE_RAW instead
  # — the checkout by default, which is both offline and the version under test.
  cp "$REPO_ROOT/backup.sh" "$dir/"

  step "running install.sh ${args[*]-}"
  local started=$SECONDS
  # bash 3.2 (macOS) treats "${arr[@]}" on an empty array as unbound under set -u.
  ( cd "$dir" && env "PATH=$WORK/bin:$PATH" "DOCKER_LOG=$dir/docker.log" \
      "RAW=${CASE_RAW:-file://$REPO_ROOT}" \
      ${envs[@]+"${envs[@]}"} sh "$INSTALL" ${args[@]+"${args[@]}"} ) \
    < /dev/null > "$dir/out.log" 2>&1 &
  local pid=$! code=0
  while kill -0 "$pid" 2> /dev/null; do
    if [ $((SECONDS - started)) -ge "$CASE_TIMEOUT" ]; then
      pkill -P "$pid" 2> /dev/null
      kill -TERM "$pid" 2> /dev/null
      wait "$pid" 2> /dev/null
      code=124
      break
    fi
    sleep 1
  done
  [ "$code" = 124 ] || { wait "$pid"; code=$?; }
  echo "$code" > "$dir/exit"

  if [ "$code" = 124 ]; then
    fail "timed out after ${CASE_TIMEOUT}s — last output:$(printf '\n    %s' "$(tail -3 "$dir/out.log")")"
  else
    step "install.sh exited $code after $((SECONDS - started))s"
  fi
}

exit_code() { cat "$WORK/$1/exit"; }
envfile() { cat "$WORK/$1/.env" 2>/dev/null; }

# has <dir> <line> — exact line present in the generated .env
has() {
  if grep -qxF "$2" "$WORK/$1/.env" 2>/dev/null; then pass "$2"; else
    fail "expected .env line '$2', got:$(printf '\n%s' "$(envfile "$1")")"
  fi
}

hasnt() {
  if grep -q "^$2=" "$WORK/$1/.env" 2>/dev/null; then
    fail "did not expect $2 in .env"
  else pass "no $2"; fi
}

# ---------------------------------------------------------------------------
case_name="defaults"
printf '\n%s\n' "$case_name"
run defaults AUTH_PASSWORD=hunter2 -- --yes --no-start
[ "$(exit_code defaults)" = 0 ] || fail "exit $(exit_code defaults): $(cat "$WORK/defaults/out.log")"
has defaults "AUTH_LOGIN=admin"
has defaults "AUTH_PASSWORD=hunter2"
has defaults "BASE_URL=http://localhost:8080"
hasnt defaults "DOMAIN"
hasnt defaults "DATABASE_URL"
hasnt defaults "S3_BUCKET"
if grep -qE '^AUTH_SECRET=[0-9a-f]{64}$' "$WORK/defaults/.env"; then pass "AUTH_SECRET is 32 random bytes"
else fail "AUTH_SECRET is not 64 hex chars: $(grep '^AUTH_SECRET=' "$WORK/defaults/.env")"; fi
if grep -qE '^POSTGRES_PASSWORD=[0-9a-f]{64}$' "$WORK/defaults/.env"; then pass "POSTGRES_PASSWORD generated"
else fail "POSTGRES_PASSWORD is not 64 hex chars"; fi
# .env holds the admin password and every secret in the deploy.
perms=$(ls -l "$WORK/defaults/.env" | cut -c1-10)
[ "$perms" = "-rw-------" ] && pass "mode 600" || fail "mode is $perms, want -rw-------"
grep -q "Not launching" "$WORK/defaults/out.log" && pass "--no-start stopped before launch" ||
  fail "--no-start still tried to launch"
if grep -qE '(^| )(pull|up)( |$)' "$WORK/defaults/docker.log" 2> /dev/null; then
  fail "--no-start ran docker: $(cat "$WORK/defaults/docker.log")"
else pass "--no-start invoked no docker pull/up"; fi

# ---------------------------------------------------------------------------
case_name="unattended without a password"
printf '\n%s\n' "$case_name"
run nopass -- --yes --no-start
[ "$(exit_code nopass)" != 0 ] && pass "refused to install" || fail "wrote an empty admin password"
grep -q "AUTH_PASSWORD" "$WORK/nopass/out.log" && pass "says which variable is missing" ||
  fail "error does not name AUTH_PASSWORD: $(cat "$WORK/nopass/out.log")"
[ -f "$WORK/nopass/.env" ] && fail "left a half-written .env behind" || pass "no .env written"

# ---------------------------------------------------------------------------
case_name="pre-supplied answers"
printf '\n%s\n' "$case_name"
run supplied \
  AUTH_LOGIN=rita AUTH_PASSWORD=s3cret \
  BASE_URL=http://box.local:9000 WEB_PORT=9000 \
  DATABASE_URL=postgres://u:p@db.example:5432/doska \
  S3_BUCKET=cards S3_REGION=eu-central-1 \
  AWS_ACCESS_KEY_ID=AKIA AWS_SECRET_ACCESS_KEY=shh \
  -- --yes --no-start
[ "$(exit_code supplied)" = 0 ] || fail "exit $(exit_code supplied): $(cat "$WORK/supplied/out.log")"
has supplied "AUTH_LOGIN=rita"
has supplied "BASE_URL=http://box.local:9000"
has supplied "WEB_PORT=9000"
has supplied "DATABASE_URL=postgres://u:p@db.example:5432/doska"
has supplied "S3_BUCKET=cards"
has supplied "S3_REGION=eu-central-1"
has supplied "AWS_ACCESS_KEY_ID=AKIA"
has supplied "AWS_SECRET_ACCESS_KEY=shh"

# ---------------------------------------------------------------------------
case_name="https domain"
printf '\n%s\n' "$case_name"
run https AUTH_PASSWORD=x DOMAIN=doska.example.com -- --yes --no-start
has https "BASE_URL=https://doska.example.com"
has https "DOMAIN=doska.example.com"
# Caddy fronts the stack, so the plain-http port must not stay public.
has https "WEB_HOST_BIND=127.0.0.1"
grep -q -- "--profile https" "$WORK/https/out.log" && pass "start hint includes the https profile" ||
  fail "start hint omits --profile https: $(cat "$WORK/https/out.log")"

# ---------------------------------------------------------------------------
# An unescaped $ reaches compose as interpolation and locks the admin out.
case_name="dollar signs are escaped for compose"
printf '\n%s\n' "$case_name"
run dollars 'AUTH_PASSWORD=p@$$w0rd' -- --yes --no-start
has dollars 'AUTH_PASSWORD=p@$$$$w0rd'

# ---------------------------------------------------------------------------
case_name="re-run keeps the existing .env"
printf '\n%s\n' "$case_name"
run rerun AUTH_PASSWORD=first -- --yes --no-start
cp "$WORK/rerun/.env" "$WORK/rerun/.env.before"
( cd "$WORK/rerun" && env "RAW=file://$REPO_ROOT" AUTH_PASSWORD=second sh "$INSTALL" --yes --no-start ) \
  < /dev/null > "$WORK/rerun/out2.log" 2>&1
if diff -q "$WORK/rerun/.env.before" "$WORK/rerun/.env" > /dev/null; then
  pass "second run left .env untouched"
else
  fail "second run rewrote .env — existing secrets would stop matching the data"
fi

# ---------------------------------------------------------------------------
case_name="unresponsive docker daemon"
printf '\n%s\n' "$case_name"
run wedged AUTH_PASSWORD=x DOCKER_STUB_HANG=1 DOCKER_TIMEOUT=3 -- --yes --no-start
[ "$(exit_code wedged)" = 0 ] && pass "finished instead of hanging" ||
  fail "exit $(exit_code wedged): $(cat "$WORK/wedged/out.log")"
grep -qi "isn't answering" "$WORK/wedged/out.log" && pass "warned about the daemon" ||
  fail "no warning: $(cat "$WORK/wedged/out.log")"
has wedged "AUTH_LOGIN=admin"

# ---------------------------------------------------------------------------
case_name="missing docker compose"
printf '\n%s\n' "$case_name"
run nocompose AUTH_PASSWORD=x DOCKER_STUB_NO_COMPOSE=1 -- --yes --no-start
[ "$(exit_code nocompose)" != 0 ] && pass "refused to continue" || fail "installed without compose"
grep -qi "compose is not available" "$WORK/nocompose/out.log" && pass "says compose is missing" ||
  fail "unhelpful error: $(cat "$WORK/nocompose/out.log")"

# ---------------------------------------------------------------------------
case_name="bad flag"
printf '\n%s\n' "$case_name"
run badflag AUTH_PASSWORD=x -- --frobnicate
[ "$(exit_code badflag)" = 2 ] && pass "exits 2" || fail "exit $(exit_code badflag), want 2"
grep -q "unknown option" "$WORK/badflag/out.log" && pass "explains why" || fail "no explanation"

# ---------------------------------------------------------------------------
case_name="compose file is fetched when absent"
printf '\n%s\n' "$case_name"
run getcompose AUTH_PASSWORD=x -- --yes --no-start
if diff -q "$COMPOSE_SRC" "$WORK/getcompose/docker-compose.selfhost.yml" > /dev/null 2>&1; then
  pass "matches the source compose file"
else
  fail "compose file missing or wrong after a fresh install"
fi
[ -f "$WORK/getcompose/docker-compose.selfhost.yml.bak" ] &&
  fail "wrote a .bak on a fresh install" || pass "no .bak"

# ---------------------------------------------------------------------------
# The 0.18.0 regression: images moved to an nginx upstream whose network alias
# only existed in the newer compose file, and the installer kept the old one.
case_name="a stale compose file is refreshed"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/stale"
printf 'services:\n  server:\n    # the old shape, no doska-api alias\n' \
  > "$WORK/stale/docker-compose.selfhost.yml"
run stale AUTH_PASSWORD=x -- --yes --no-start
if diff -q "$COMPOSE_SRC" "$WORK/stale/docker-compose.selfhost.yml" > /dev/null 2>&1; then
  pass "replaced with the current one"
else
  fail "kept the stale compose file — new images would boot an old stack"
fi
grep -q "no doska-api alias" "$WORK/stale/docker-compose.selfhost.yml.bak" 2>/dev/null &&
  pass "previous copy kept as .bak" || fail "the user's compose file was lost"

# ---------------------------------------------------------------------------
case_name="an up-to-date compose file is left alone"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/current"
cp "$COMPOSE_SRC" "$WORK/current/"
run current AUTH_PASSWORD=x -- --yes --no-start
[ -f "$WORK/current/docker-compose.selfhost.yml.bak" ] &&
  fail "backed up an identical file" || pass "no .bak churn"

# ---------------------------------------------------------------------------
# Continuing offline would pull new images onto whatever old stack is on disk.
case_name="an unreachable source stops the install"
printf '\n%s\n' "$case_name"
mkdir -p "$WORK/offline"
cp "$COMPOSE_SRC" "$WORK/offline/"
CASE_RAW="file:///nonexistent-doska-source"
run offline AUTH_PASSWORD=x -- --yes --no-start
CASE_RAW=""
[ "$(exit_code offline)" != 0 ] && pass "refused to continue" ||
  fail "installed against a compose file it could not verify"
grep -q "might break the server" "$WORK/offline/out.log" && pass "explains the risk" ||
  fail "unhelpful error: $(cat "$WORK/offline/out.log")"
diff -q "$COMPOSE_SRC" "$WORK/offline/docker-compose.selfhost.yml" > /dev/null 2>&1 &&
  pass "left the existing compose file intact" || fail "damaged the compose file on the way out"
[ -f "$WORK/offline/docker-compose.selfhost.yml.new" ] &&
  fail "left a .new temp file behind" || pass "no temp file left behind"

# ---------------------------------------------------------------------------
printf '\n'
if [ "$failures" -gt 0 ]; then
  printf '%d assertion(s) failed\n' "$failures" >&2
  exit 1
fi
printf 'install.sh: all cases passed\n'
