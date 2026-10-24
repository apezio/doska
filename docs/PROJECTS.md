# Projects

A **project** is the shared state of a piece of work that spans several cards,
boards and Claude sessions: a status, a "where things stand" summary,
workstreams with their current plan and steps, open decisions and blockers,
linked cards and the sessions working on it. Cards stay the source of truth for
task status — a project only links them. Every change appends to the project's
activity history, so a replaced plan or summary is never lost. Projects live at
`/projects` in the web app and are readable and writable over MCP, so you and
any number of Claude sessions see and update the same picture.

## Open Session

Each session on a project is keyed by its **worktree** (an absolute path on the
machine the session runs on) and remembers the latest Claude session id.
When `MISS_CLAUDE_URL` is configured, the server gives every session an "Open
session" link:

```
$MISS_CLAUDE_URL/open?worktree=<worktree>&session=<claude session id>
```

The client never builds this URL; when the variable is unset the link is
simply absent. Miss Claude resolves the link to a mission — first by the
mission's worktree, then by the Claude session id its console is (or was)
writing — and redirects to that mission's dashboard, where the console is
attached, or started and the session resumed. Add `&view=chat` to land on the
chat view instead. The link sits behind Miss Claude's own login.

## Configuration

**Server.** Set `MISS_CLAUDE_URL` to the origin your browser reaches Miss
Claude on, without a trailing slash:

- dev preview: in `scripts/dev-preview.local.sh` (gitignored), e.g.
  `MISS_CLAUDE_URL=https://<miss-claude-host>:<port>`. `scripts/dev-preview.sh`
  copies it into the generated `apps/server/.env` on every start.
- a deployment: in that server's environment / `.env`.

Never commit a real host: the repo is public.

**Claude sessions.** Add the Doska MCP server once per Claude Code install:

```sh
claude mcp add --transport http doska https://<your-doska-server>/mcp
```

The first call opens a browser to sign in. A session sees only the projects of
the account it signed in as.

## Automatic updates

Miss Claude's dev consoles run a SessionStart hook
(`scripts/doska-project-context.py` in Miss Claude) that injects a short
`== DOSKA PROJECTS ==` block: the worktree, mission, branch, repo id and Claude
session id. It fires at startup and again after `/clear`, `/compact` and resume.
If the Doska MCP tools are available, Claude calls `session_start` with those
values: every project with a session on this worktree is touched and its
context brief returned, which Claude treats as the shared state for its work.
From then on Claude calls `record_progress` at natural checkpoints only —
hand-off, asking for approval, a plan change, a new blocker, a decision needed,
before a long pause — never after every message. Without the MCP tools the
block is ignored and nothing changes.

To attach a session to a project the first time, ask Claude to call
`register_session` (or `session_start` with a `project_id`).
