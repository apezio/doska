# Projects

A **project** is the shared state of a piece of work that spans several cards,
boards and Claude sessions: a status, a "where things stand" summary,
workstreams with their current plan and steps, open decisions and blockers,
linked cards and the sessions working on it. Cards stay the source of truth for
task status — a project only links them. Every change appends to the project's
activity history, so a replaced plan or summary is never lost. Projects live at
`/projects` in the web app and are readable and writable over MCP, so you and
any number of Claude sessions see and update the same picture.

## Sessions on several machines

Each session on a project is keyed by its **worktree** (an absolute path on the
machine the session runs on) and remembers the latest Claude session id and
the **Miss Claude dashboard** it runs under (`dashboard_url`, passed to
`session_start`). Miss Claude can run on more than one machine; Doska handles
each session on its own one.

**Open session.** The server gives every session a link to its own dashboard,
or to the first one in `MISS_CLAUDE_URL` when the session never named one. A
session that knows its mission links straight to that mission's page:

```
<dashboard>/m/<mission>/dashboard
```

Without a mission it goes through Miss Claude's resolver, which matches the
mission's worktree, then the Claude session id its console is (or was)
writing:

```
<dashboard>/open?worktree=<worktree>&session=<claude session id>
```

Either sits behind Miss Claude's own login, so the dashboard must be the
hostname you log in on. With more than one dashboard configured, each session
card says which one the session runs on ("on jump").

**Start session.** The Sessions section has one button per configured
dashboard ("Start on dev", "Start on jump"). It opens that dashboard's spawn
form with the mission name and the project filled in:

```
<dashboard>/spawn?name=<mission>&doska_project=<project id>
```

The mission is named after the project, skipping names its sessions already
use. The new console's Claude joins the project itself, through
`session_start` with that `project_id`.

**Chat.** A session that knows its mission also gets a Chat button, which
opens that mission's Miss Claude card (titlebar and chat) in a side panel,
framed at 80% from

```
<dashboard>/m/<mission>/card
```

Reading and typing there go straight to the console. The frame carries Miss
Claude's login only when Doska and the dashboard are the same site (say
`doska.example.net` and `dev.example.net`); from anywhere else it shows Miss
Claude's login page instead.

The client never builds any of these URLs; with no dashboard configured they
are absent.

**Answering decisions.** A decision whose body is a numbered list offers each
item as a one-click answer. The session that raised it reads the answer under
"Since your last call, the operator answered:" in its next `session_start` or
`record_progress` reply. If that session is live and has a chat, the chat opens
so you can tell it now.

## Configuration

**Server.** Set `MISS_CLAUDE_URL` to the dashboards your browser reaches Miss
Claude on, comma-separated, the default first, without trailing slashes:

- dev preview: in `scripts/dev-preview.local.sh` (gitignored), e.g.
  `MISS_CLAUDE_URL=https://<host-a>:<port>,https://<host-b>:<port>`.
  `scripts/dev-preview.sh` copies it into the generated `apps/server/.env` on
  every start.
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
`== DOSKA PROJECTS ==` block: the worktree, mission, branch, repo id, Claude
session id, its own dashboard URL and, for a mission started from a project,
that project's id. It fires at startup and again after `/clear`, `/compact` and resume.
If the Doska MCP tools are available, Claude calls `session_start` with those
values: every project with a session on this worktree is touched and its
context brief returned, which Claude treats as the shared state for its work.
From then on Claude calls `record_progress` at natural checkpoints only —
hand-off, asking for approval, a plan change, a new blocker, a decision needed,
before a long pause — never after every message. Without the MCP tools the
block is ignored and nothing changes.

To attach a session to a project the first time, ask Claude to call
`register_session` (or `session_start` with a `project_id`).
