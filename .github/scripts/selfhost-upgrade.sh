#!/usr/bin/env bash
# Local run of the CI upgrade scenario: boot the last released images, seed data,
# upgrade to the :ci images built from this checkout, assert the data survived.
#
# Build the :ci images first:
#   docker build -f apps/server/Dockerfile -t ghcr.io/romenkova/doska-server:ci .
#   docker build -f apps/client/Dockerfile -t ghcr.io/romenkova/doska-web:ci .
set -euo pipefail
cd "$(dirname "$0")/../.."

OLD="docker compose -f docker-compose.selfhost.yml"
NEW="$OLD -f .github/ci/selfhost.override.yml"

./.github/scripts/selfhost-require-images.sh

[ -f .env ] || ./.github/ci/write-env.sh http://localhost:8080
envval() { grep "^$1=" .env | head -1 | cut -d= -f2-; }

printf '\n== booting the last released version ==\n'
DOCKER_IMAGE_TAG=latest $OLD up -d --wait
COMPOSE="$OLD" ./.github/scripts/selfhost-data.sh seed

printf '\n== upgrading to this checkout ==\n'
DOCKER_IMAGE_TAG=ci $NEW up -d --wait
COMPOSE="$NEW" ./.github/scripts/selfhost-data.sh verify

printf '\n== smoke test ==\n'
BASE=$(envval BASE_URL) \
  AUTH_LOGIN=$(envval AUTH_LOGIN) AUTH_PASSWORD=$(envval AUTH_PASSWORD) \
  ./.github/scripts/selfhost-smoke.sh
