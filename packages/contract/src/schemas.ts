import { z } from "zod"
import { PRIORITY_MAX, PRIORITY_MIN, PRIORITY_NONE, toPriority } from "./priority"

/**
 * Entity schemas shared by client and server
 *
 *  - `updatedAt`: client clock (ms). The last-writer-wins tiebreaker.
 *  - `deletedAt`: tombstone. `null` while live; set to a timestamp on delete so
 *    the deletion propagates to other clients instead of vanishing silently.
 */

/**
 * A file attached to a card.
 *
 *  - `name`: editable display label, shown on the tile. Independent of storage.
 *  - `key`: opaque, backend-specific handle (an S3 object key, or a filename in
 *    the card's on-disk sidecar). Rewritten when files migrate between backends.
 */

const ATTACHMENT_KEY =
  /^att\/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}(\.[a-z0-9]+)?$/

export const AttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string().regex(ATTACHMENT_KEY),
  mime: z.string(),
  size: z.number(),
})

/**
 * A card's priority on the wire. Accepts anything the field has ever held and
 * normalises it, so a card written by an older client migrates as it is read.
 */
export const PrioritySchema = z
  .preprocess(toPriority, z.number().int().min(PRIORITY_MIN).max(PRIORITY_MAX))
  .default(PRIORITY_NONE)

export const CardSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  position: z.string(),
  columnId: z.string(),
  /**
   * Human-readable per-board card number, shown as the card's id. Allocated
   * server-side from a per-board counter on the card's first sync, so it's
   * `null` until then.
   */
  number: z.number().nullable().default(null),
  /** Optional deadline as an ISO date string (`YYYY-MM-DD`); `null` when unset. */
  deadline: z.string().nullable().default(null),
  /**
   * Importance as an integer 0–100, `0` for none. Older records — and older
   * clients pushing over sync — carry the retired `high`/`medium`/`low`/`""`
   * enum, so the field is read through `toPriority` rather than rejected.
   */
  priority: PrioritySchema,
  /** Attached files; travels with the card's last-writer-wins record. */
  attachments: z.array(AttachmentSchema).default([]),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

export const ColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  position: z.string(),
  dashboardId: z.string(),
  /** When true the column's card bodies are collapsed down to their titles. */
  collapsed: z.boolean().default(false),
  /**
   * Palette id tinting the column and any `[[card]]` reference to a card in
   * it. Empty for no color; see `COLUMN_COLORS` in the ui-kit.
   */
  color: z.string().default(""),
  /** Cards in this column are finished. At most one column per board has it. */
  done: z.boolean().default(false),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

export const DashboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  position: z.string(),
  sort: z.array(z.string()).default([]),
  /**
   * The board this one is nested under in the sidebar, or null at the top
   * level. Purely organisational: nesting changes where a board sits in the
   * list and nothing about its contents. `position` orders siblings.
   */
  parentId: z.string().nullable().default(null),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

/**
 * The whole of a published board, as `GET /api/public/b/:token` returns it.
 *
 * Built out of the record schemas above on purpose: everything the sync tables
 * carry beyond them — `seq`, `owner_id`, the share token itself — is internal,
 * and reusing the wire shapes is what keeps it out. Tombstones are excluded by
 * the query, so every record here is live.
 */
export const PublicBoardSchema = z.object({
  dashboard: DashboardSchema,
  columns: z.array(ColumnSchema),
  cards: z.array(CardSchema),
})

/** Ship editors only; `'owner'` exists so widening roles needs no migration. */
export const MemberRoleSchema = z.enum(["owner", "editor"])

/** Someone with access to a board, as the share dialog's roster renders them.
 * The owner is in there too, with `role: 'owner'` and no membership row. */
export const MemberSchema = z.object({
  userId: z.string(),
  username: z.string(),
  role: MemberRoleSchema,
})

/** An account in the server's directory — everything the member picker gets. */
export const DirectoryUserSchema = z.object({
  id: z.string(),
  username: z.string(),
})

/** A dashboard list change. The dashboard list syncs on its own account-level
 * channel (see `dashboards.sync`), independent of any open board, so it carries
 * only dashboard records. */
export const DashboardChangeSchema = z.object({
  store: z.literal("dashboards"),
  record: DashboardSchema,
})

/** One record change, tagged by the store it belongs to. */
export const ChangeSchema = z.discriminatedUnion("store", [
  z.object({ store: z.literal("cards"), record: CardSchema }),
  z.object({ store: z.literal("columns"), record: ColumnSchema }),
  DashboardChangeSchema,
])

/**
 * Projects are online-only RPC records, like `members`: no sync channel, no
 * client clock. Ids and timestamps are the server's. `version` bumps on every
 * write so a caller can pass `ifVersion` and be refused instead of overwriting
 * a change it never saw.
 */
export const ProjectStatusSchema = z.enum([
  "active",
  "blocked",
  "waiting",
  "paused",
  "done",
])

export const WorkstreamStatusSchema = z.enum([
  "planned",
  "active",
  "blocked",
  "waiting",
  "done",
  "deferred",
])

export const PlanStateSchema = z.enum(["proposed", "approved"])

export const StepSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
})

/** A step as a caller writes it: the server mints a missing id. */
export const StepInputSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  done: z.boolean().default(false),
})

export const DecisionKindSchema = z.enum(["decision", "blocker"])
export const DecisionStatusSchema = z.enum(["open", "resolved"])

export const ProjectEventKindSchema = z.enum([
  "created",
  "status",
  "summary",
  "plan",
  "steps",
  "decision",
  "blocker",
  "card",
  "session",
  "note",
])

/** Who made a write: the web UI, or an agent over MCP. */
export const ProjectActorSchema = z.enum(["user", "mcp"])

export const ProjectSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string(),
  status: ProjectStatusSchema,
  /** Where things stand, in a few lines. */
  summary: z.string(),
  summaryUpdatedAt: z.number().nullable(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

export const WorkstreamSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  status: WorkstreamStatusSchema,
  /** Markdown; the current plan only — replaced ones live in the events. */
  plan: z.string(),
  planState: PlanStateSchema,
  steps: z.array(StepSchema),
  /** Ids of workstreams in the same project that come first. */
  dependsOn: z.array(z.string()),
  /** Short blocker / waiting-on note. */
  note: z.string(),
  position: z.number(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

/** Decisions and blockers share one shape; `kind` tells them apart. */
export const ProjectDecisionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  workstreamId: z.string().nullable(),
  kind: DecisionKindSchema,
  title: z.string(),
  body: z.string(),
  status: DecisionStatusSchema,
  resolution: z.string(),
  createdAt: z.number(),
  resolvedAt: z.number().nullable(),
  deletedAt: z.number().nullable(),
  sessionId: z.string().nullable(),
})

/** A Miss Claude session working on the project, keyed by its worktree. */
export const ProjectSessionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  workstreamId: z.string().nullable(),
  label: z.string(),
  mission: z.string(),
  worktree: z.string(),
  branch: z.string(),
  repoId: z.string(),
  claudeSessionId: z.string(),
  /** The Miss Claude dashboard the session runs under; "" = the default one. */
  dashboardUrl: z.string(),
  lastEvent: z.string(),
  lastActivityAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
})

/** `openUrl` is built by the server; null when it has no Miss Claude URL. */
export const ProjectSessionDetailSchema = ProjectSessionSchema.extend({
  openUrl: z.string().nullable(),
})

export const ProjectEventSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  workstreamId: z.string().nullable(),
  kind: ProjectEventKindSchema,
  message: z.string(),
  /** The fields this write replaced, as they were — e.g. `{ plan }`. */
  before: z.record(z.string(), z.unknown()).nullable(),
  sessionId: z.string().nullable(),
  actor: ProjectActorSchema,
  createdAt: z.number(),
})

/**
 * A card linked to a project, resolved at read time — the card stays the source
 * of truth. A card the viewer can no longer see keeps its row with `accessible:
 * false` and blank title, so the UI can say it is gone without leaking it.
 */
export const LinkedCardSchema = z.object({
  projectId: z.string(),
  boardId: z.string(),
  cardId: z.string(),
  workstreamId: z.string().nullable(),
  boardName: z.string(),
  title: z.string(),
  number: z.number().nullable(),
  /** The card sits in its board's done column. */
  done: z.boolean(),
  deleted: z.boolean(),
  accessible: z.boolean(),
})

export const ProjectSummarySchema = ProjectSchema.extend({
  workstreams: z.object({
    total: z.number(),
    done: z.number(),
    blocked: z.number(),
    active: z.number(),
  }),
  openBlockers: z.number(),
  openDecisions: z.number(),
  /** Sessions active in the last 24 hours. */
  activeSessions: z.number(),
  sessionCount: z.number(),
  cards: z.object({ total: z.number(), done: z.number() }),
  lastActivityAt: z.number(),
})

export const ProjectDetailSchema = z.object({
  project: ProjectSchema,
  workstreams: z.array(WorkstreamSchema),
  decisions: z.array(ProjectDecisionSchema),
  cards: z.array(LinkedCardSchema),
  sessions: z.array(ProjectSessionDetailSchema),
  /** One per configured Miss Claude dashboard; empty when there is none. */
  spawnUrls: z.array(z.object({ label: z.string(), url: z.string() })),
  /** Newest first, at most 100. */
  events: z.array(ProjectEventSchema),
})
