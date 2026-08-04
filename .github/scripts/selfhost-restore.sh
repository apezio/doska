#!/usr/bin/env bash
# Local run of the CI restore scenario: seed data, back up, destroy the volume,
# restore the dump, assert the data came back.
#
# The database volume is deleted and rebuilt from the dump backup.sh just wrote.
set -euo pipefail
cd "$(dirname "$0")/../.."

COMPOSE="docker compose -f docker-compose.selfhost.yml -f .github/ci/selfhost.override.yml"
export COMPOSE

./.github/scripts/selfhost-require-images.sh

[ -f .env ] || ./.github/ci/write-env.sh http://localhost:8080
envval() { grep "^$1=" .env | head -1 | cut -d= -f2-; }

printf '\n== seeding ==\n'
$COMPOSE up -d --wait
./.github/scripts/selfhost-data.sh seed

printf '\n== backing up ==\n'
sh backup.sh

printf '\n== destroying the database ==\n'
$COMPOSE down --volumes

printf '\n== restoring ==\n'
$COMPOSE up -d --wait db
dump=$(ls -t backups/*.sql.gz | head -1)
gunzip -c "$dump" | $COMPOSE exec -T db psql -U doska -d doska -v ON_ERROR_STOP=1 --quiet
$COMPOSE up -d --wait
./.github/scripts/selfhost-data.sh verify

printf '\n== smoke test ==\n'
BASE=$(envval BASE_URL) \
  AUTH_LOGIN=$(envval AUTH_LOGIN) AUTH_PASSWORD=$(envval AUTH_PASSWORD) \
  ./.github/scripts/selfhost-smoke.sh
