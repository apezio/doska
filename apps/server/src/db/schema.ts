import type {
  Attachment,
  DecisionKind,
  DecisionStatus,
  MemberRole,
  PlanState,
  ProjectActor,
  ProjectEventKind,
  ProjectStatus,
  Step,
  WorkstreamStatus,
} from "@doska/contract"
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core"

// Auth is better-auth's, schema and all; it lives beside ours so that one
// `import * as schema` covers both the adapter and drizzle-kit.
export * from "./auth-schema"

/**
 * Timestamps and sequence numbers are stored as plain integers, but a board's
 * `updatedAt`/`deletedAt` are epoch milliseconds (~1.7e12) and overflow a
 * 32-bit `integer`, so they use `bigint` in `number` mode. Sequence counters
 * stay `integer`: a single channel's monotonic tick never approaches 2^31.
 */

/**
 * Named monotonic counters, one per sync channel, created lazily on first sync.
 * Each board keeps its per-board tick under id `board:<id>`; the dashboard list
 * uses id `"dashboards"` for an account-level ordering, letting a client pull
 * every board's metadata past its cursor regardless of which board is open.
 */
export const counters = pgTable("counters", {
  id: text("id").primaryKey(),
  value: integer("value").notNull().default(0),
})

/**
 * The three entity tables mirror `@doska/contract` (= the client's `types.ts`),
 * each augmented with sync metadata:
 *
 *  - `updatedAt`: client clock, the last-writer-wins tiebreaker.
 *  - `deletedAt`: tombstone (null = live).
 *  - `seq`: stamped from the owning board's counter on every write, so a client
 *    can pull everything past its cursor with `board_id = ? AND seq > since`.
 *
 * `boardId` is denormalized onto columns and cards so that pull is a single
 * indexed scan with no joins. A dashboard *is* a board, so it's keyed by `id`.
 * Relationships are by id only — no FK constraints, so an out-of-order tick
 * (a card arriving before its column) is never rejected.
 *
 * A dashboard's `seq` is stamped from the account-level `counters` row, not a
 * board counter: the list is board-independent, so its pull is `seq > since`
 * across every dashboard.
 */
export const dashboards = pgTable(
  "dashboards",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    position: text("position").notNull(),
    sort: jsonb("sort").$type<string[]>().notNull().default([]),
    parentId: text("parent_id"),
    ownerId: text("owner_id"),
    publicToken: text("public_token").unique(),
    publishedAt: bigint("published_at", { mode: "number" }),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    seq: integer("seq").notNull(),
  },
  (t) => [index("dashboards_owner_seq").on(t.ownerId, t.seq)]
)

export const columns = pgTable(
  "columns",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id").notNull(),
    title: text("title").notNull(),
    position: text("position").notNull(),
    collapsed: boolean("collapsed").notNull().default(false),
    color: text("color").notNull().default(""),
    done: boolean("done").notNull().default(false),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    seq: integer("seq").notNull(),
  },
  (t) => [index("columns_board_seq").on(t.boardId, t.seq)]
)

export const cards = pgTable(
  "cards",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id").notNull(),
    columnId: text("column_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    position: text("position").notNull(),
    number: integer("number"),
    deadline: text("deadline"),
    /** 0–100, higher is more important; 0 for none. See `@doska/contract`. */
    priority: integer("priority").notNull().default(0),
    attachments: jsonb("attachments")
      .$type<Attachment[]>()
      .notNull()
      .default([]),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    seq: integer("seq").notNull(),
  },
  (t) => [index("cards_board_seq").on(t.boardId, t.seq)]
)

/**
 * Boards shared with an account other than the owner.
 *
 * `seq` is stamped from the *board-list* counter (`counters.id = 'boards-list'`,
 * the same one dashboards use), not from a per-board counter, and it is the
 * point of the table. A client's board-list cursor has usually already passed
 * the shared board's own `dashboards.seq`, so nothing would ever reach it;
 * stamping the membership row from the same global counter puts an event past
 * that cursor. Re-stamp it on every change to the row, revocation included.
 *
 * Revoking sets `revoked_at` and never deletes: a deleted row carries no `seq`,
 * so the client would never learn it lost access.
 */
export const boardMembers = pgTable(
  "board_members",
  {
    boardId: text("board_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").$type<MemberRole>().notNull().default("editor"),
    seq: integer("seq").notNull(),
    revokedAt: bigint("revoked_at", { mode: "number" }),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.boardId, t.userId] }),
    index("board_members_user_seq").on(t.userId, t.seq),
  ]
)

/**
 * Projects: online-only RPC records (no `seq`, no sync channel), owned by the
 * account that created them. Ids are `<kind>-<12 hex>` minted by the server,
 * times are server epoch ms. `version` is the optimistic-concurrency counter
 * behind `ifVersion`; decisions, cards, sessions and events are rows of their
 * own (append or upsert), so they need none.
 */
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").$type<ProjectStatus>().notNull().default("active"),
    summary: text("summary").notNull().default(""),
    summaryUpdatedAt: bigint("summary_updated_at", { mode: "number" }),
    version: integer("version").notNull().default(1),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (t) => [index("projects_owner").on(t.ownerId)]
)

export const workstreams = pgTable(
  "workstreams",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull(),
    status: text("status")
      .$type<WorkstreamStatus>()
      .notNull()
      .default("planned"),
    plan: text("plan").notNull().default(""),
    planState: text("plan_state")
      .$type<PlanState>()
      .notNull()
      .default("proposed"),
    steps: jsonb("steps").$type<Step[]>().notNull().default([]),
    dependsOn: jsonb("depends_on").$type<string[]>().notNull().default([]),
    note: text("note").notNull().default(""),
    position: integer("position").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (t) => [index("workstreams_project").on(t.projectId)]
)

/** Decisions and blockers — one table, `kind` tells them apart. */
export const projectDecisions = pgTable(
  "project_decisions",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    workstreamId: text("workstream_id"),
    kind: text("kind").$type<DecisionKind>().notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    status: text("status").$type<DecisionStatus>().notNull().default("open"),
    resolution: text("resolution").notNull().default(""),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    resolvedAt: bigint("resolved_at", { mode: "number" }),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    sessionId: text("session_id"),
  },
  (t) => [index("project_decisions_project").on(t.projectId)]
)

/** A link only: title, number and done are read from the card itself. */
export const projectCards = pgTable(
  "project_cards",
  {
    projectId: text("project_id").notNull(),
    boardId: text("board_id").notNull(),
    cardId: text("card_id").notNull(),
    workstreamId: text("workstream_id"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.cardId] })]
)

/**
 * Miss Claude sessions. The worktree is the stable key — a mission's Claude
 * session id changes on every restart, so it is only a hint.
 */
export const projectSessions = pgTable(
  "project_sessions",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    workstreamId: text("workstream_id"),
    /** A step of that workstream (its `steps` JSON id); null = the whole workstream. */
    stepId: text("step_id"),
    label: text("label").notNull().default(""),
    mission: text("mission").notNull().default(""),
    worktree: text("worktree").notNull(),
    branch: text("branch").notNull().default(""),
    repoId: text("repo_id").notNull().default(""),
    claudeSessionId: text("claude_session_id").notNull().default(""),
    dashboardUrl: text("dashboard_url").notNull().default(""),
    lastEvent: text("last_event").notNull().default(""),
    lastActivityAt: bigint("last_activity_at", { mode: "number" }),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
  },
  (t) => [
    uniqueIndex("project_sessions_project_worktree").on(
      t.projectId,
      t.worktree
    ),
  ]
)

/** Append-only activity, and the history of what each write replaced. */
export const projectEvents = pgTable(
  "project_events",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    workstreamId: text("workstream_id"),
    kind: text("kind").$type<ProjectEventKind>().notNull(),
    message: text("message").notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    sessionId: text("session_id"),
    actor: text("actor").$type<ProjectActor>().notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (t) => [index("project_events_project_created").on(t.projectId, t.createdAt)]
)
