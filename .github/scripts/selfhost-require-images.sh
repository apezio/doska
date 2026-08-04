#!/usr/bin/env bash
# Fails unless the :ci images this checkout's tests boot are present locally.
set -euo pipefail

missing=0
for image in doska-server doska-web; do
  docker image inspect "ghcr.io/romenkova/$image:ci" > /dev/null 2>&1 && continue
  printf 'ghcr.io/romenkova/%s:ci is not built\n' "$image" >&2
  missing=1
done

if [ "$missing" = 1 ]; then
  printf 'build both first:\n' >&2
  printf '  docker build -f apps/server/Dockerfile -t ghcr.io/romenkova/doska-server:ci .\n' >&2
  printf '  docker build -f apps/client/Dockerfile -t ghcr.io/romenkova/doska-web:ci .\n' >&2
  exit 1
fi
