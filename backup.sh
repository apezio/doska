#!/bin/sh
# Back up a self-hosted Doska to ./backups/:
#
#   doska-<timestamp>.sql.gz    the bundled Postgres
#   doska-files-<timestamp>.tar.gz   card attachments, from the doska-files volume
#
#
# Restore the database into an empty one with only `db` running — a booted
# server has already migrated the schema and seeded the admin account, and the
# dump would land on tables and rows that exist:
#
# ON_ERROR_STOP=1 matters: without it psql reports success even when every
# statement failed, so a restore onto a non-empty database looks like it worked.
#
#   docker compose -f docker-compose.selfhost.yml down --volumes
#   docker compose -f docker-compose.selfhost.yml up -d --wait db
#   gunzip -c backups/doska-XXXX.sql.gz | \
#     docker compose -f docker-compose.selfhost.yml exec -T db \
#       psql -v ON_ERROR_STOP=1 -U doska doska
#
# Restore the attachments into the (recreated, empty) volume before starting up.
# Restore both halves from the same timestamp: the database holds the rows that
# name the files, so a mismatched pair means cards pointing at blobs that aren't
# there.
#
#   docker compose -f docker-compose.selfhost.yml up -d --no-start server
#   gunzip -c backups/doska-files-XXXX.tar.gz | \
#     docker run --rm -i -v <project>_doska-files:/data alpine tar xf - -C /data
#   docker compose -f docker-compose.selfhost.yml up -d
set -eu

COMPOSE_FILE="docker-compose.selfhost.yml"
ENV_FILE=".env"

red()  { printf '\033[31m%s\033[0m\n' "$1" >&2; }
bold() { printf '\033[1m%s\033[0m\n' "$1"; }
die()  { red "error: $1"; exit 1; }

command -v docker > /dev/null 2>&1 || die "docker is not installed."
if docker compose version > /dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  die "docker compose is not available."
fi
[ -f "$COMPOSE_FILE" ] || die "$COMPOSE_FILE not found — run this from your Doska directory."

# Volume names are scoped to the compose project (default: lowercased dir
# basename), so another Doska on the same host isn't mistaken for ours.
# Compose also requires the name to start with a letter or digit and drops any
# leading `-`/`_` — miss that and we'd look for a volume that doesn't exist and
# cheerfully report there was nothing to back up.
if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then
  PROJECT="$COMPOSE_PROJECT_NAME"
else
  PROJECT=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-' |
    sed 's/^[^a-z0-9]*//')
  [ -n "$PROJECT" ] ||
    die "cannot derive a compose project name from this directory — set COMPOSE_PROJECT_NAME."
fi
has_volume() { docker volume ls -q 2>/dev/null | grep -qx "${PROJECT}_$1"; }

# Compose interpolates the whole file even to touch one service, and the server
# service marks AUTH_*/BASE_URL as required. With no .env (e.g. called to rescue
# data before a fresh setup) feed placeholders so compose can load — the db
# service ignores them and the server is never started here.
if [ ! -f "$ENV_FILE" ]; then
  export AUTH_LOGIN=x AUTH_PASSWORD=x AUTH_SECRET=x BASE_URL=http://localhost
fi

mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
SAVED=0

backup_db() {
  # Leading whitespace and all: compose trims it, so a value it honours must not
  # look unset to us, or we'd back up the idle bundled db and call it a backup.
  if [ -f "$ENV_FILE" ] &&
    grep -q '^[[:blank:]]*DATABASE_URL=..*' "$ENV_FILE" 2>/dev/null; then
    bold "Managed Postgres (DATABASE_URL is set) — back it up through your provider."
    return 0
  fi
  if ! has_volume doska-pgdata; then
    bold "No bundled database volume yet — skipping the database."
    return 0
  fi

  bold "Backing up the bundled database"
  $COMPOSE -f "$COMPOSE_FILE" up -d db > /dev/null 2>&1 || true

  _i=0
  until $COMPOSE -f "$COMPOSE_FILE" exec -T db pg_isready -U doska -d doska > /dev/null 2>&1; do
    _i=$((_i + 1))
    [ "$_i" -ge 30 ] && die "database did not become ready."
    sleep 1
  done

  _out="backups/doska-$STAMP.sql.gz"
  _tmp="backups/.dump.$$"
  # Dump to a temp file first so pg_dump's own exit status is what we check — a
  # plain pipe into gzip would mask a failed dump behind gzip's success. Gzip to
  # a second temp and rename, so $_out only ever appears complete: two runs in
  # the same second share a timestamp, and writing it in place interleaves them
  # into a corrupt archive that still reports success.
  if $COMPOSE -f "$COMPOSE_FILE" exec -T db pg_dump -U doska doska > "$_tmp" 2>/dev/null &&
    gzip < "$_tmp" > "$_tmp.gz"; then
    mv "$_tmp.gz" "$_out"
    rm -f "$_tmp"
    printf '  saved %s (%s)\n' "$_out" "$(du -h "$_out" | cut -f1)"
    SAVED=$((SAVED + 1))
  else
    rm -f "$_tmp" "$_tmp.gz"
    die "pg_dump failed — nothing written."
  fi
}

# Attachments live in a plain volume
backup_files() {
  if ! has_volume doska-files; then
    bold "No attachments volume — skipping card files."
    return 0
  fi

  bold "Backing up card attachments"
  _out="backups/doska-files-$STAMP.tar.gz"
  _tmp="backups/.files.$$"
  if docker run --rm -v "${PROJECT}_doska-files:/data:ro" alpine:3 \
      tar cz -C /data . > "$_tmp" 2>/dev/null; then
    mv "$_tmp" "$_out"
    printf '  saved %s (%s)\n' "$_out" "$(du -h "$_out" | cut -f1)"
    SAVED=$((SAVED + 1))
  else
    rm -f "$_tmp"
    die "could not archive the attachments volume — nothing written."
  fi
}

backup_db
backup_files

[ "$SAVED" -eq 0 ] && bold "Nothing to back up yet."
exit 0
