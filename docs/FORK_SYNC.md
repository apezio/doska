# Syncing the fork from romenkova/doska

The other direction: bringing upstream's commits into the fork. That is a
mission like any other — its own worktree, its own `claude/<mission>` branch,
handed off and shipped the normal way — except that the work itself *is* a
merge:

```
git fetch upstream
git merge upstream/main        # onto claude/<mission>, in your own worktree
```

The misswork guard blocks `git merge` for feature workers, and no phrase unlocks
it, so this is the third and last carve-out — narrower than the two
`/upstream-pr` ones, and re-derived from git rather than taken on trust. It
allows exactly `git merge <ref>` where:

- the ref is a real remote-tracking branch (`refs/remotes/upstream/...`) of a
  remote literally named `upstream` whose URL is **not** origin's;
- `HEAD` is a `claude/<mission>` branch in this worktree — never `working`,
  never `main`, never a local branch;
- exactly one ref, and the only flags allowed are ones that affect how this
  merge is recorded (`--no-ff`, `--no-commit`, `--no-edit`, `--stat`, …) — no
  strategy, signing or message options.

`--abort`, `--quit` and `--continue` are allowed on their own while a merge this
rule started is in progress, so a conflicted sync is resolvable in place.
Everything else still blocks: merging `working`, `main`, a local branch or
another remote, and merging into anything but a mission branch. Do not ask the
operator to hand-run the merge, and do not widen the exception.

Resolve conflicts on the mission branch, verify with `pnpm test` /
`type-check` / `lint`, hand off for review, and ship it like any feature — the
merge commit reaches `working` through the ordinary ff-only integration, since
the mission branch was cut from `working` to begin with. If the sync moved
dependencies or migrations, say so at hand-off: the integrator's `reload` is
what re-installs and restarts the one preview.
