# @doska/mcp

The board as MCP tools, so an agent can read and edit it: create cards from a
discussion, tick off task lists, move things between columns, tidy up a board.

The tools are transport-agnostic — they talk to a `BoardStore`, and the server
(`apps/server`) implements it straight onto the sync tables. Edits land in
Postgres and reach your other devices on their next sync, exactly as if you had
made them in the app.

## Connecting

The server serves these at `/mcp`, behind OAuth. From Claude Code:

```sh
claude mcp add --transport http doska https://your-server/mcp
```

The first call opens a browser to sign in; the client registers itself and holds
an access token from there on. Same URL works for Claude Desktop and claude.ai.

## Tools

| Tool                             | What it does                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `list_boards`                    | Every board with its id and title                                                      |
| `get_board`                      | One board in full: columns with color and done flag, each with its cards               |
| `get_card`                       | One card, without pulling the whole board                                              |
| `create_board`                   | New board with the default To Do / In Progress / Done columns                          |
| `rename_board`, `delete_board`   | Rename; delete along with its columns and cards                                        |
| `create_column`, `delete_column` | Delete takes the column's cards with it                                                |
| `update_column`                  | Title, color, collapsed, or which column counts as done                                |
| `move_column`                    | Reorder: to either end, or next to another column                                      |
| `create_card`                    | Add a card to a column — title, Markdown body, optional deadline and priority 0–100    |
| `update_card`                    | Edit title, body, deadline, priority 0–100; or `append` instead of rewriting the body  |
| `move_card`                      | To another column, to an end of one, or directly above a named card                    |
| `set_card_done`                  | Into the board's done column, or back out to the leftmost open one                     |
| `check_task`                     | Tick or untick one task-list checkbox by index, leaving the rest of the body untouched |
| `delete_card`                    | Delete a card                                                                          |
| `search_cards`                   | Across every board, by text, deadline range, `priorityMin` / `priorityMax`, or column  |
| `list_upcoming`                  | The app's upcoming view: overdue first, then today, then out to 60 days                |
| `list_projects`                  | Every project with status, one-line summary and counts                                 |
| `get_project`                    | One project in full: workstreams, decisions, cards, sessions, last 100 events          |
| `get_project_context`            | A short plain-text brief of a project — what a session reads first                     |
| `session_start`                  | Projects this worktree is registered on, each with its brief and `session_id`          |
| `create_project`                 | New project: name, optional description, status, summary                               |
| `update_project`                 | Patch name, description, status or summary (`if_version`)                              |
| `create_workstream`              | Add a workstream: plan, steps, dependencies; its plan starts proposed                  |
| `update_workstream`              | Patch a workstream (`if_version`, `message` for why the plan changed)                  |
| `set_step`                       | Tick or untick one step by id or exact text                                            |
| `add_decision`                   | Raise a decision or blocker for the operator                                           |
| `resolve_decision`               | Close one with the operator's resolution                                               |
| `link_card`, `unlink_card`       | Link a board card to the project, optionally under a workstream                        |
| `register_session`               | Join a project as the session in a worktree, or refresh it                             |
| `record_progress`                | Checkpoint: log a note, optionally summary, workstream status and steps                |

Every tool addresses records by their opaque id. A card also comes back with a
`cardId` number, but that exists only so one card body can link to another as
`[[12]]` — it is not input to any tool.

The server also ships `instructions` (see `guide.ts`): the board's own concepts —
the done column, deadlines, priority — and the Markdown dialect card bodies are
written in,
which is `[[card]]` links, `==highlight==` and the `-cut-` line on
top of GFM. None of that is inferable from a tool schema, and a client that
doesn't read it will write bodies that render wrong.

A card's priority is an integer 0–100, higher is more important, `0` for none —
pass `0` or `null` to clear it. Cards written on the old high / medium / low
scale read 75 / 50 / 25.

Project tools take snake_case arguments (`project_id`, `if_version`). A write
with a stale `if_version` is refused with the record's current version and
value, so the agent can merge. Pass `session_id` (from `session_start` or
`register_session`) on writes so the activity log shows which session made them.

Deletes are tombstones, the same as in the app: they propagate to your other
devices rather than letting a peer resurrect the record on its next sync.

Attachments are read-only here — a card's files come back on `get_board`, but
uploading one goes through the server's file endpoints, not the sync channel.
