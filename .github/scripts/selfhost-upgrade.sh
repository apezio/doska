#!/usr/bin/env bash
# Local run of the CI upgrade scenario: boot the last release from its own compose
# file and images, seed data, check the :ci images still run on that old compose
# file, then upgrade to this checkout's compose file and assert the data survived.
#
# Build the :ci images first:
#   docker build -f apps/server/Dockerfile -t ghcr.io/apezio/doska-server:ci .
#   docker build -f apps/client/Dockerfile -t ghcr.io/apezio/doska-web:ci .
set -euo pipefail
cd "$(dirname "$0")/../.."

PREV=""
for tag in $(git tag -l 'v*' --sort=-v:refname); do
  case "$tag" in *-*) continue ;; esac # skip prereleases; `latest` is clean semver
  PREV="$tag"
  break
done
[ -n "$PREV" ] || { echo "no release tag found, run 'git fetch --tags'" >&2; exit 1; }

PREV_FILE=.selfhost-prev-compose.yml
git show "$PREV:docker-compose.selfhost.yml" > "$PREV_FILE"

# Same directory, so all three stages keep the same compose project and its volumes.
OLD="docker compose -f $PREV_FILE"
COMPAT="docker compose -f $PREV_FILE -f .github/ci/selfhost.override.yml"
NEW="docker compose -f docker-compose.selfhost.yml -f .github/ci/selfhost.override.yml"

./.github/scripts/selfhost-require-images.sh

[ -f .env ] || ./.github/ci/write-env.sh http://localhost:8080
envval() { grep "^$1=" .env | head -1 | cut -d= -f2-; }
smoke() {
  BASE=$(envval BASE_URL) \
    AUTH_LOGIN=$(envval AUTH_LOGIN) AUTH_PASSWORD=$(envval AUTH_PASSWORD) \
    ./.github/scripts/selfhost-smoke.sh
}

printf '\n== booting %s, from its own compose file ==\n' "$PREV"
DOCKER_IMAGE_TAG=latest $OLD up -d --wait
COMPOSE="$OLD" ./.github/scripts/selfhost-data.sh seed

printf '\n== new images on %s compose file ==\n' "$PREV"
DOCKER_IMAGE_TAG=ci $COMPAT up -d --wait
smoke

printf '\n== upgrading to this checkout ==\n'
DOCKER_IMAGE_TAG=ci $NEW up -d --wait
COMPOSE="$NEW" ./.github/scripts/selfhost-data.sh verify

printf '\n== smoke test ==\n'
smoke

rm -f "$PREV_FILE"
