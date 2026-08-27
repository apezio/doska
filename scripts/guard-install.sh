#!/usr/bin/env bash
# Runs before every `pnpm install` / `pnpm add` / `pnpm update` in this repo
# (wired as the root `pnpm:devPreinstall` script).
#
# On the dev box, mission worktrees do not have their own node_modules: the root
# and each package's node_modules are symlinks into the canonical checkout, whose
# modules the one live dev preview is running on. `pnpm install` follows those
# symlinks and rewrites the live preview's node_modules from under it. So refuse
# whenever any workspace node_modules here is a symlink. Real installs (the
# canonical checkout, CI, docker, a fresh clone) have real directories and pass.
set -u
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
links=()
for nm in "$root/node_modules" "$root"/apps/*/node_modules "$root"/packages/*/node_modules; do
  [ -L "$nm" ] && links+=("$nm")
done
[ "${#links[@]}" -eq 0 ] && exit 0

cat >&2 <<MSG

refusing to install: node_modules here is a symlink into the canonical
checkout, and installing would rewrite the live dev preview's modules:

$(for l in "${links[@]}"; do printf '  %s -> %s\n' "${l#$root/}" "$(readlink "$l")"; done)

Feature worktrees never install into shared modules. If your branch really
changes dependencies, give this worktree its own private install first:

  find . -name node_modules -type l -not -path '*/node_modules/*' -delete
  CI=true pnpm install

That writes a fresh node_modules HERE only and leaves the canonical
checkout (and the preview on it) untouched. Once the change is integrated
into 'working', scripts/dev-preview.sh reload installs it for the preview.

MSG
exit 1
