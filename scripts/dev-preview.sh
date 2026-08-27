#!/usr/bin/env bash
# Doska dev preview — exactly ONE, served from the canonical checkout.
#
# There is one permanent dev server on this box. It runs from the main (canonical)
# worktree on the `working` branch and is the only preview anyone looks at:
#
#   db   PGlite over a Postgres socket   127.0.0.1:5434   (apps/server/pgdata)
#   api  Fastify under `tsx watch`       127.0.0.1:3101   (restarts on server edits)
#   web  Vite dev server + HMR           $WEB_HOST:5174   (HTTPS/HTTP2)
#
# Mission worktrees never start a preview of their own: `start` refuses outside
# the canonical checkout, there are no port offsets, and a feature becomes
# visible on :5174 the moment it is integrated into `working` (the post-merge
# hook reloads the one preview; Vite HMR / tsx watch pick the sources up).
# Workers still run tests / type-check / lint in their own worktrees.
#
# Usage (from any worktree; lifecycle verbs only act on the canonical checkout):
#   scripts/dev-preview.sh start | stop | restart | reload | status | logs | check | url
#
# Env overrides: WEB_HOST (default 127.0.0.1). PORT_OFFSET is no longer honoured.
#
# Box-specific values (the address the operator's browser reaches this box on,
# and anything else that should not live in a public repo) go in the main
# worktree's scripts/dev-preview.local.sh — gitignored, sourced below, and shared
# by every worktree:
#
#   WEB_HOST=203.0.113.7
#   NODE_BIN=$HOME/.nvm/versions/node/v22.x.y/bin
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# The integration checkout and the staging branch. CANONICAL_ROOT is the ONLY
# place a preview runs from; it is also where every worktree's node_modules
# symlinks to, and it holds the box-local config below. CANONICAL_BRANCH is what
# `check` measures a mission against. The integration checkout is by definition
# the repo's main worktree, which git reports first; deriving it keeps this
# script path-free.
CANONICAL_ROOT="$(git -C "$ROOT" worktree list --porcelain 2>/dev/null | awk '/^worktree /{print substr($0,10); exit}')"
CANONICAL_ROOT="${CANONICAL_ROOT:-$ROOT}"
CANONICAL_BRANCH="working"

# Untracked, box-specific overrides (WEB_HOST, NODE_BIN, ...). It lives in the main
# worktree and serves every worktree, so a mission does not need its own copy;
# a per-worktree file still wins if one exists. An explicit env var beats both.
_env_web_host="${WEB_HOST:-}"
for _conf in "$CANONICAL_ROOT/scripts/dev-preview.local.sh" "$ROOT/scripts/dev-preview.local.sh"; do
  # shellcheck source=/dev/null
  [ -f "$_conf" ] && . "$_conf"
done
[ -n "$_env_web_host" ] && WEB_HOST="$_env_web_host"
unset _env_web_host _conf

# Fixed ports. 5173/3000/5432 are not ours (Vite's stock default and the staging
# deploy), so the one preview lives one above them. No offsets: a second preview
# is exactly what this script exists to prevent.
WEB_HOST="${WEB_HOST:-127.0.0.1}"
WEB_PORT=5174
API_PORT=3101
PG_PORT=5434

# The preview's identity is the canonical checkout, so every worktree's copy of
# this script talks about the same one. Lifecycle verbs additionally require
# being run from it (see assert_canonical); config files are written into it.
IS_CANONICAL=0
[ "$(cd "$ROOT" && pwd -P)" = "$(cd "$CANONICAL_ROOT" && pwd -P)" ] && IS_CANONICAL=1

# Node 22 is required (see .nvmrc). If the system node is older, point NODE_BIN
# at a Node 22 bin directory in dev-preview.local.sh; it is put first on PATH.
[ -n "${NODE_BIN:-}" ] && [ -d "$NODE_BIN" ] && export PATH="$NODE_BIN:$PATH"

# TLS, and it is a performance feature, not a security one. Vite only speaks
# HTTP/2 when server.https is set, and without HTTP/2 a refresh is ~200 separate
# module revalidations squeezed through the browser's 6-connection HTTP/1.1
# limit — ~4s at 60ms RTT, ~8s at 120ms. Over HTTP/2 they multiplex on one
# connection: ~0.9s and ~1.6s. Self-signed, so each browser accepts the warning
# once. Cached outside the repo and outside /tmp so it survives reboots.
CERTDIR="$HOME/.cache/doska-dev-cert"
CERT="$CERTDIR/$WEB_HOST.crt"
CERTKEY="$CERTDIR/$WEB_HOST.key"

STATE="/tmp/doska-preview"
mkdir -p "$STATE"
LOG="$STATE/dev.log"
PIDFILE="$STATE/dev.pids"

# --- generated dev-only files (both gitignored) -----------------------------

ensure_dev_cert() {
  # Regenerated only when missing or expired. SAN must carry the IP, not just
  # CN — browsers ignore CN for host matching.
  if [ -f "$CERT" ] && [ -f "$CERTKEY" ] \
     && openssl x509 -checkend 604800 -noout -in "$CERT" >/dev/null 2>&1; then
    return 0
  fi
  mkdir -p "$CERTDIR"
  echo "generating self-signed dev cert for $WEB_HOST (valid 825 days)"
  openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
    -keyout "$CERTKEY" -out "$CERT" \
    -subj "/CN=$WEB_HOST" \
    -addext "subjectAltName=IP:$WEB_HOST,DNS:localhost,IP:127.0.0.1" \
    >/dev/null 2>&1 || { echo "failed to generate dev cert"; exit 1; }
  chmod 600 "$CERTKEY"
}

write_server_env() {
  # apps/server/.env is gitignored. Regenerated on every start so the ports
  # always match this script; put nothing here you want to keep.
  cat > "$ROOT/apps/server/.env" <<ENV
# Generated by scripts/dev-preview.sh — regenerated on every start, do not edit.
# Loopback only: this box has public IPs and the API has no business on them.
HOST=127.0.0.1
PORT=$API_PORT
PG_SOCKET_PORT=$PG_PORT
DB_FILE=pgdata
FILE_DIR_OVERRIDE=filedata
AUTH_LOGIN=admin
AUTH_PASSWORD=dev
AUTH_SECRET=dev-only-secret-not-for-production
AUTH_TRUSTED_ORIGINS=https://$WEB_HOST:$WEB_PORT,https://localhost:$WEB_PORT
AUTH_RATE_LIMIT=off
ENV
}

write_vite_config() {
  # The checked-in vite.config.ts hardcodes the API proxy at :3000 — which on
  # this box is the staging server — and binds localhost. This override fixes
  # both. It lives in apps/client/.vite/, already covered by .gitignore, so it
  # never shows up in git status.
  #
  CFGDIR="$ROOT/apps/client/.vite"
  mkdir -p "$CFGDIR"
  cat > "$CFGDIR/vite.config.dev.ts" <<CFG
// Generated by scripts/dev-preview.sh — regenerated on every start.
import path from "path"
import { defineConfig, mergeConfig } from "vite"
import base from "../vite.config"

const CLIENT = "$ROOT/apps/client"

export default mergeConfig(base, defineConfig({
  root: CLIENT,
  resolve: { alias: { "@": path.resolve(CLIENT, "src") } },
  server: {
    // One specific IP, never 0.0.0.0, so the preview can't shadow anything
    // else on this box.
    host: "$WEB_HOST",
    allowedHosts: true,
    port: $WEB_PORT,
    strictPort: true,
    // Setting https is what makes Vite serve HTTP/2 (see ensure_dev_cert).
    // The /api proxy below still works: Vite terminates h2 and forwards h1.
    https: { key: "$CERTKEY", cert: "$CERT" },
    fs: { allow: [CLIENT, "$ROOT"] },
    proxy: Object.fromEntries(
      ["/api", "/mcp", "/.well-known"].map((p) => [p, "http://127.0.0.1:$API_PORT"])
    ),
  },
}))
CFG
}

# --- lifecycle ---------------------------------------------------------------

port_up() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

# The one preview runs from the canonical checkout, full stop. A mission
# worktree that wants to see its work integrates it into `working`.
assert_canonical() {
  [ "$IS_CANONICAL" = 1 ] && return 0
  cat >&2 <<MSG
refusing: previews run only from the canonical checkout ($CANONICAL_ROOT).
This is a mission worktree ($ROOT); it never starts a Vite server of its own.

The one dev preview is https://$WEB_HOST:$WEB_PORT/ — it serves branch
'$CANONICAL_BRANCH' and shows your feature as soon as it is integrated there.
Run tests / type-check / lint here; see CLAUDE.md.
MSG
  exit 1
}
# PORT_OFFSET used to pick a per-worktree preview. There is only one now.
if [ -n "${PORT_OFFSET:-}" ] && [ "$PORT_OFFSET" != "1" ]; then
  echo "refusing: PORT_OFFSET=$PORT_OFFSET — there is one preview, on 5174/3101/5434; offsets are gone (see CLAUDE.md)." >&2
  exit 1
fi

# The two things a running stack cannot hot-reload, fingerprinted separately
# because they need very different responses. Recorded at start, compared by
# `reload` after an integration.
migrations_fingerprint() {
  cat "$ROOT/apps/server/drizzle/meta/_journal.json" 2>/dev/null \
    | sha256sum | cut -d' ' -f1
}
deps_fingerprint() {
  {
    cat "$ROOT/pnpm-lock.yaml"
    find "$ROOT/apps" "$ROOT/packages" -maxdepth 2 -name package.json -exec cat {} +
  } 2>/dev/null | sha256sum | cut -d' ' -f1
}

# Keeping the preview in step with git. The hooks live in the COMMON git dir, so
# one install covers every worktree of this repo — and each hook acts only when
# the git command ran in the canonical checkout (a merge into `working`, a branch
# switch there, a rebase there); in a mission worktree they are a no-op.
#
#   post-merge     an integration landed  -> reload (fingerprint decides)
#   post-checkout  a branch switch        -> reload
#   post-rewrite   a rebase               -> RESTART, unconditionally
#
# A rebase is why post-rewrite is separate. It rewrites the tree under a running
# Vite, which applies partial HMR updates and can leave the module graph
# initialising out of order — observed as `runtime used before installRuntime()`
# from packages/core, and a white page that survives a refresh. HMR can patch
# edits; it cannot recover a history rewrite. Only a restart clears it.
install_preview_hooks() {
  local common hook marker
  common="$(git -C "$ROOT" rev-parse --git-common-dir 2>/dev/null)" || return 0
  case "$common" in /*) ;; *) common="$ROOT/$common" ;; esac
  [ -d "$common/hooks" ] || return 0
  marker="# managed by scripts/dev-preview.sh"
  for hook in post-merge post-checkout post-rewrite; do
    if [ -e "$common/hooks/$hook" ] && ! grep -qF "$marker" "$common/hooks/$hook" 2>/dev/null; then
      echo "note: $common/hooks/$hook exists and is not ours — leaving it alone;"
      echo "      run 'scripts/dev-preview.sh reload' by hand after an integration."
      continue
    fi
    # Written via a temp file and mv(1): the hook calls back into this script,
    # which reinstalls the hooks — truncating a file bash is still reading would
    # corrupt the run. Replacing the inode leaves it intact.
    cat > "$common/hooks/$hook.new" <<HOOK
#!/usr/bin/env bash
$marker — keep this worktree's preview in step with git.
KIND=$hook

# git exports GIT_DIR/GIT_WORK_TREE/GIT_INDEX_FILE into hooks, which would
# otherwise override the -C of every git command below.
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_PREFIX

# git runs these hooks with cwd at the top of the working tree the command ran
# in — that is how a hook shared by every worktree knows which preview to touch.
top="\$(pwd -P)"
[ -x "\$top/scripts/dev-preview.sh" ] || exit 0

gitdir="\$(git -C "\$top" rev-parse --git-dir 2>/dev/null)" || exit 0
case "\$gitdir" in /*) ;; *) gitdir="\$top/\$gitdir" ;; esac

# Mid-rebase, git fires post-checkout once per replayed commit. Restarting a
# stack on each of those would be absurd; post-rewrite handles it once at the
# end. post-rewrite is exempt from this check because git still has
# \$gitdir/rebase-merge on disk when it runs the hook (measured) — treating that
# as "in progress" would skip the very case the hook exists for.
if [ "\$KIND" != post-rewrite ] \\
   && { [ -d "\$gitdir/rebase-merge" ] || [ -d "\$gitdir/rebase-apply" ]; }; then
  exit 0
fi

verb=reload
if [ "\$KIND" = post-rewrite ]; then
  # post-rewrite also fires for \`commit --amend\` (\$1 = amend), which is an
  # ordinary edit HMR handles fine. Only a rebase needs the restart.
  [ "\$1" = rebase ] || exit 0
  verb=restart
fi

# Only the canonical checkout has a preview, and only if one is actually up
# (dev.pids exists while a stack is running), so this never starts a preview
# nobody asked for and never touches anything from a mission worktree. Never
# block the git command.
canon="\$(git -C "\$top" worktree list --porcelain 2>/dev/null | awk '/^worktree /{print substr(\$0,10); exit}')"
[ -n "\$canon" ] && [ "\$(cd "\$canon" && pwd -P)" = "\$top" ] || exit 0
[ -e /tmp/doska-preview/dev.pids ] || exit 0
"\$top/scripts/dev-preview.sh" "\$verb" || true
exit 0
HOOK
    chmod +x "$common/hooks/$hook.new"
    mv -f "$common/hooks/$hook.new" "$common/hooks/$hook"
  done
}

start() {
  assert_canonical
  if running; then echo "already running"; status; return 0; fi
  : > "$LOG"
  ensure_dev_cert
  write_server_env
  write_vite_config
  : > "$PIDFILE"
  deps_fingerprint > "$STATE/deps.sha"
  migrations_fingerprint > "$STATE/migrations.sha"
  install_preview_hooks

  cd "$ROOT/apps/server" || exit 1
  setsid node_modules/.bin/tsx --env-file-if-exists=.env src/serve-dev.ts >> "$LOG" 2>&1 &
  echo $! >> "$PIDFILE"

  for _ in $(seq 1 60); do port_up "$PG_PORT" && break; sleep 0.5; done

  DATABASE_URL="postgres://127.0.0.1:$PG_PORT/postgres" \
    setsid node_modules/.bin/tsx watch --env-file-if-exists=.env src/index.ts >> "$LOG" 2>&1 &
  echo $! >> "$PIDFILE"

  cd "$ROOT/apps/client" || exit 1
  setsid node_modules/.bin/vite --config "$CFGDIR/vite.config.dev.ts" >> "$LOG" 2>&1 &
  echo $! >> "$PIDFILE"

  sleep 8
  status
}

stop() {
  assert_canonical
  if [ -f "$PIDFILE" ]; then
    while read -r p; do
      [ -n "$p" ] || continue
      kill -- -"$p" 2>/dev/null || kill "$p" 2>/dev/null
    done < "$PIDFILE"
    rm -f "$PIDFILE"
  fi
  sleep 1
  echo "stopped"
}

# `reload` is the post-integration step: Vite HMR and `tsx watch` have already
# picked up every source file the merge changed, so the only question left is
# whether migrations or dependencies moved — those a running stack cannot absorb.
#
# Migrations: restart, they run at server boot.
# Dependencies: `pnpm install` rewrites node_modules under the running stack,
# which dies mid-resolve when it does — so the install happens with the stack
# stopped, then it is started again. This is safe precisely because there is
# only one preview and it is this one; nothing else on the box uses these
# modules live (worktrees symlink here, but scripts/guard-install.sh keeps
# them from installing into it).
reload() {
  assert_canonical
  if ! running; then
    echo "reload: preview is not running — nothing to reload"
    status
    return 0
  fi
  local deps_now deps_prev mig_now mig_prev
  deps_now="$(deps_fingerprint)";      deps_prev="$(cat "$STATE/deps.sha" 2>/dev/null || echo none)"
  mig_now="$(migrations_fingerprint)"; mig_prev="$(cat "$STATE/migrations.sha" 2>/dev/null || echo none)"

  if [ "$deps_now" != "$deps_prev" ]; then
    echo "reload: dependencies changed — stopping, installing, restarting"
    stop
    ( cd "$ROOT" && CI=true pnpm install ) > "$STATE/install.log" 2>&1 \
      || { echo "reload: pnpm install FAILED — see $STATE/install.log; preview left stopped"; exit 1; }
    start
    return 0
  fi

  if [ "$mig_now" != "$mig_prev" ]; then
    echo "reload: migrations changed — restarting so they run at server boot"
    stop
    start
    return 0
  fi

  echo "reload: no restart needed — Vite HMR and tsx watch already serve the current checkout"
  status
}

running() {
  [ -f "$PIDFILE" ] || return 1
  while read -r p; do kill -0 "$p" 2>/dev/null || return 1; done < "$PIDFILE"
  return 0
}

status() {
  printf 'db  (%s):        %s\n' "$PG_PORT" "$(port_up "$PG_PORT" && echo up || echo DOWN)"
  printf 'api (%s):        %s\n' "$API_PORT" "$(curl -s -m 3 "http://127.0.0.1:$API_PORT/api/version" || echo DOWN)"
  printf 'web (%s:%s): %s\n' "$WEB_HOST" "$WEB_PORT" \
    "$(curl -sk -m 3 -o /dev/null -w '%{http_code}' "https://$WEB_HOST:$WEB_PORT/" || echo DOWN)"
  printf 'url:               %s\n' "https://$WEB_HOST:$WEB_PORT/"
}

# `check` is the pre-flight a session runs before starting a feature: is this
# worktree free to work in, and is it on current main?
check() {
  cd "$ROOT" || exit 1
  local branch dirty behind ahead verdict=CLEAN
  branch="$(git rev-parse --abbrev-ref HEAD)"
  dirty="$(git status --porcelain)"
  read -r behind ahead < <(git rev-list --left-right --count "$CANONICAL_BRANCH"...HEAD | tr '\t' ' ')

  echo "worktree: $ROOT"
  echo "branch:   $branch"
  if [ "$(cd "$ROOT" && pwd -P)" = "$(cd "$CANONICAL_ROOT" 2>/dev/null && pwd -P)" ]; then
    echo "role:     canonical checkout — the one preview (https://$WEB_HOST:$WEB_PORT/) runs from here"
  else
    echo "role:     mission worktree — no preview here; integrate into $CANONICAL_BRANCH to see it on https://$WEB_HOST:$WEB_PORT/"
  fi
  if [ -n "$dirty" ]; then
    verdict=DIRTY
    echo "state:    DIRTY — unfinished work lives here, do NOT overwrite it:"
    echo "$dirty" | sed 's/^/            /'
  else
    echo "state:    clean"
  fi
  echo "vs $CANONICAL_BRANCH: $behind behind, $ahead ahead"
  [ "$behind" != "0" ] && verdict="${verdict}/BEHIND"
  echo "verdict:  $verdict"
  echo
  status
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  restart) assert_canonical; stop; start ;;
  reload) reload ;;
  status) status ;;
  check) check ;;
  logs) assert_canonical; tail -f "$LOG" ;;
  url) echo "https://$WEB_HOST:$WEB_PORT/" ;;
  *) echo "usage: $0 start|stop|restart|reload|status|check|logs|url"; exit 1 ;;
esac
