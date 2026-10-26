/**
 * Projects data layer, shared by the RPC router and the MCP store. Every
 * function checks access itself, so a caller only supplies who is asking and
 * which surface it came through (`actor`).
 *
 *   assertProjectAccess(userId, projectId) → ProjectRow
 *   listProjects(userId) → ProjectSummary[]
 *   getProject(userId, { id }) → ProjectDetail
 *   createProject(userId, input, actor?) → Project
 *   updateProject(userId, input, actor?) → Project       (CONFLICT on ifVersion)
 *   removeProject(userId, { id }) → { ok: true }
 *   getWorkstream(userId, id) → Workstream
 *   createWorkstream(userId, input, actor?) → Workstream
 *   updateWorkstream(userId, input, actor?) → Workstream (CONFLICT on ifVersion)
 *   removeWorkstream(userId, input, actor?) → { ok: true }
 *   createDecision(userId, input, actor?) → ProjectDecision
 *   updateDecision(userId, input, actor?) → ProjectDecision
 *   linkCard(userId, input, actor?) → { ok: true }
 *   unlinkCard(userId, input, actor?) → { ok: true }
 *   registerSession(userId, input, actor?) → ProjectSession
 *   removeSession(userId, input, actor?) → { ok: true }
 *   addNote(userId, input, actor?) → ProjectEvent
 *
 * Inputs are the `contract.projects.*` input types. A write carrying a
 * `sessionId` also marks that session active.
 */
import { randomUUID } from "node:crypto"
import { basename } from "node:path"
import { isDeepStrictEqual } from "node:util"
import type {
  contract,
  LinkedCard,
  Project,
  ProjectActor,
  ProjectDecision,
  ProjectDetail,
  ProjectEvent,
  ProjectEventKind,
  ProjectSession,
  ProjectSummary,
  Step,
  StepInput,
  Workstream,
} from "@doska/contract"
import type { InferContractRouterInputs } from "@orpc/contract"
import { ORPCError } from "@orpc/server"
import { and, asc, desc, eq, inArray, isNull, max } from "drizzle-orm"
import { boardAccess, type BoardAccess } from "./access"
import { findAccount } from "./accounts"
import { db } from "./client"
import {
  cards,
  columns,
  dashboards,
  projectCards,
  projectDecisions,
  projectEvents,
  projects,
  projectSessions,
  workstreams,
} from "./schema"

type Inputs = InferContractRouterInputs<typeof contract>["projects"]
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Ok = { ok: true }

export type ProjectRow = typeof projects.$inferSelect

const OK: Ok = { ok: true }
const EVENT_LIMIT = 100
const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000

function newId(kind: string): string {
  return `${kind}-${randomUUID().replaceAll("-", "").slice(0, 12)}`
}

let lastNow = 0
/** Strictly increasing, so events written within one millisecond still sort. */
function now(): number {
  lastNow = Math.max(Date.now(), lastNow + 1)
  return lastNow
}

/** Owner or admin; a deleted project is as gone as a missing one. */
export async function assertProjectAccess(
  userId: string,
  projectId: string
): Promise<ProjectRow> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1)
  if (!row)
    throw new ORPCError("NOT_FOUND", { message: `No project ${projectId}` })
  if (row.ownerId !== userId && !(await findAccount(userId))?.isAdmin)
    throw new ORPCError("FORBIDDEN")
  return row
}

function conflict(what: string, current: object & { version: number }) {
  return new ORPCError("CONFLICT", {
    message: `${what} changed: it is at version ${current.version}. Re-read it and merge.`,
    data: { current },
  })
}

/** The fields of `next` that differ from `cur`, and what they replace. */
function diff<T extends object>(cur: T, next: Partial<T>) {
  const patch: Partial<T> = {}
  const before: Partial<T> = {}
  for (const key of Object.keys(next) as (keyof T)[]) {
    const value = next[key]
    if (value === undefined || isDeepStrictEqual(value, cur[key])) continue
    patch[key] = value
    before[key] = cur[key]
  }
  return { patch, before, changed: Object.keys(patch).length > 0 }
}

/** The caller's own words, after what changed. */
function describe(parts: string[], message: string | undefined): string {
  const auto = parts.join("; ")
  if (!message) return auto
  return auto ? `${auto}: ${message}` : message
}

interface EventInput {
  projectId: string
  workstreamId?: string | null
  kind: ProjectEventKind
  message: string
  before?: Record<string, unknown> | null
  sessionId?: string | null
}

async function logEvent(
  tx: Tx,
  actor: ProjectActor,
  e: EventInput
): Promise<ProjectEvent> {
  const at = now()
  const [row] = await tx
    .insert(projectEvents)
    .values({
      id: newId("evt"),
      projectId: e.projectId,
      workstreamId: e.workstreamId ?? null,
      kind: e.kind,
      message: e.message,
      before: e.before ?? null,
      sessionId: e.sessionId ?? null,
      actor,
      createdAt: at,
    })
    .returning()

  // Session events manage the row themselves (registerSession).
  if (e.sessionId && e.kind !== "session")
    await tx
      .update(projectSessions)
      .set({ lastActivityAt: at, lastEvent: e.kind, updatedAt: at })
      .where(
        and(
          eq(projectSessions.id, e.sessionId),
          eq(projectSessions.projectId, e.projectId)
        )
      )

  return row
}

// --- projects ---------------------------------------------------------------

export async function listProjects(userId: string): Promise<ProjectSummary[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.ownerId, userId), isNull(projects.deletedAt)))
  if (rows.length === 0) return []
  const ids = rows.map((row) => row.id)

  const wsRows = await db
    .select({ projectId: workstreams.projectId, status: workstreams.status })
    .from(workstreams)
    .where(
      and(inArray(workstreams.projectId, ids), isNull(workstreams.deletedAt))
    )
  const decisionRows = await db
    .select({
      projectId: projectDecisions.projectId,
      kind: projectDecisions.kind,
    })
    .from(projectDecisions)
    .where(
      and(
        inArray(projectDecisions.projectId, ids),
        eq(projectDecisions.status, "open"),
        isNull(projectDecisions.deletedAt)
      )
    )
  const sessionRows = await db
    .select({
      projectId: projectSessions.projectId,
      lastActivityAt: projectSessions.lastActivityAt,
    })
    .from(projectSessions)
    .where(
      and(
        inArray(projectSessions.projectId, ids),
        isNull(projectSessions.deletedAt)
      )
    )
  const cardRows = await db
    .select({ projectId: projectCards.projectId, done: columns.done })
    .from(projectCards)
    .leftJoin(cards, eq(cards.id, projectCards.cardId))
    .leftJoin(columns, eq(columns.id, cards.columnId))
    .where(inArray(projectCards.projectId, ids))
  const eventRows = await db
    .select({
      projectId: projectEvents.projectId,
      at: max(projectEvents.createdAt),
    })
    .from(projectEvents)
    .where(inArray(projectEvents.projectId, ids))
    .groupBy(projectEvents.projectId)

  const activeSince = Date.now() - ACTIVE_WINDOW_MS
  const summaries = rows.map((project): ProjectSummary => {
    const own = <R extends { projectId: string }>(list: R[]) =>
      list.filter((r) => r.projectId === project.id)
    const ws = own(wsRows)
    const decisions = own(decisionRows)
    const sessions = own(sessionRows)
    const linked = own(cardRows)
    const lastActivityAt = Math.max(
      project.updatedAt,
      Number(own(eventRows)[0]?.at ?? 0),
      ...sessions.map((s) => s.lastActivityAt ?? 0)
    )
    return {
      ...project,
      workstreams: {
        total: ws.length,
        done: ws.filter((w) => w.status === "done").length,
        blocked: ws.filter((w) => w.status === "blocked").length,
        active: ws.filter((w) => w.status === "active").length,
      },
      openBlockers: decisions.filter((d) => d.kind === "blocker").length,
      openDecisions: decisions.filter((d) => d.kind === "decision").length,
      activeSessions: sessions.filter(
        (s) => (s.lastActivityAt ?? 0) >= activeSince
      ).length,
      sessionCount: sessions.length,
      cards: {
        total: linked.length,
        done: linked.filter((c) => c.done === true).length,
      },
      lastActivityAt,
    }
  })
  return summaries.sort((a, b) => b.lastActivityAt - a.lastActivityAt)
}

/** MISS_CLAUDE_URL: the Miss Claude dashboards, comma-separated, default first. */
function missClaudeDashboards(): string[] {
  return (process.env.MISS_CLAUDE_URL ?? "")
    .split(",")
    .map((u) => u.trim().replace(/\/+$/, ""))
    .filter(Boolean)
}

/**
 * Null when the session has no dashboard and this server knows none either.
 * A known mission links straight to its page, which every Miss Claude serves;
 * otherwise `/open` resolves the worktree or Claude session id to one.
 */
function openUrl(session: ProjectSession): string | null {
  const base =
    session.dashboardUrl.replace(/\/+$/, "") || missClaudeDashboards()[0]
  if (!base) return null
  if (session.mission)
    return `${base}/m/${encodeURIComponent(session.mission)}/dashboard`
  const query = new URLSearchParams({ worktree: session.worktree })
  if (session.claudeSessionId) query.set("session", session.claudeSessionId)
  return `${base}/open?${query}`
}

/**
 * Each dashboard, with a link to start a mission on this project there. The
 * mission is named after the project, skipping names its sessions already
 * use; the started session joins the project itself through `session_start`.
 */
function dashboardsFor(
  project: Pick<Project, "id" | "name">,
  sessions: ProjectSession[]
): ProjectDetail["dashboards"] {
  const base =
    project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "session"
  const taken = new Set(sessions.map((s) => s.mission))
  let name = base
  for (let n = 2; taken.has(name); n++) name = `${base}-${n}`
  const query = new URLSearchParams({ name, doska_project: project.id })
  return missClaudeDashboards().map((url) => {
    const host = new URL(url).hostname
    return {
      label: /^[\d.:[\]]+$/.test(host) ? host : host.split(".")[0],
      url,
      spawnUrl: `${url}/spawn?${query}`,
    }
  })
}

async function resolveCards(
  userId: string,
  projectId: string
): Promise<LinkedCard[]> {
  const rows = await db
    .select({
      link: projectCards,
      cardBoardId: cards.boardId,
      title: cards.title,
      number: cards.number,
      cardDeletedAt: cards.deletedAt,
      done: columns.done,
      boardName: dashboards.title,
      boardDeletedAt: dashboards.deletedAt,
    })
    .from(projectCards)
    .leftJoin(cards, eq(cards.id, projectCards.cardId))
    .leftJoin(columns, eq(columns.id, cards.columnId))
    .leftJoin(dashboards, eq(dashboards.id, cards.boardId))
    .where(eq(projectCards.projectId, projectId))
    .orderBy(asc(projectCards.createdAt))

  const access = new Map<string, Promise<BoardAccess>>()
  const accessTo = (boardId: string) => {
    if (!access.has(boardId)) access.set(boardId, boardAccess(userId, boardId))
    return access.get(boardId)!
  }

  return Promise.all(
    rows.map(async (row): Promise<LinkedCard> => {
      // Cards move between boards; access and the deep link follow the card.
      const boardId = row.cardBoardId ?? row.link.boardId
      const accessible = (await accessTo(boardId)) !== "denied"
      return {
        projectId: row.link.projectId,
        boardId,
        cardId: row.link.cardId,
        workstreamId: row.link.workstreamId,
        boardName: accessible ? (row.boardName ?? "") : "",
        title: accessible ? (row.title ?? "") : "",
        number: accessible ? row.number : null,
        done: accessible && row.done === true,
        deleted:
          row.title === null ||
          row.cardDeletedAt !== null ||
          row.boardDeletedAt !== null,
        accessible,
      }
    })
  )
}

export async function getProject(
  userId: string,
  input: Inputs["get"]
): Promise<ProjectDetail> {
  const project = await assertProjectAccess(userId, input.id)

  const ws = await db
    .select()
    .from(workstreams)
    .where(
      and(eq(workstreams.projectId, project.id), isNull(workstreams.deletedAt))
    )
    .orderBy(asc(workstreams.position), asc(workstreams.createdAt))
  const decisions = await db
    .select()
    .from(projectDecisions)
    .where(
      and(
        eq(projectDecisions.projectId, project.id),
        isNull(projectDecisions.deletedAt)
      )
    )
    .orderBy(asc(projectDecisions.createdAt))
  const sessions = await db
    .select()
    .from(projectSessions)
    .where(
      and(
        eq(projectSessions.projectId, project.id),
        isNull(projectSessions.deletedAt)
      )
    )
  const events = await db
    .select()
    .from(projectEvents)
    .where(eq(projectEvents.projectId, project.id))
    .orderBy(desc(projectEvents.createdAt))
    .limit(EVENT_LIMIT)

  return {
    project,
    workstreams: ws,
    decisions,
    cards: await resolveCards(userId, project.id),
    sessions: sessions
      .sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))
      .map((s) => ({ ...s, openUrl: openUrl(s) })),
    dashboards: dashboardsFor(project, sessions),
    events,
  }
}

export async function createProject(
  userId: string,
  input: Inputs["create"],
  actor: ProjectActor = "user"
): Promise<Project> {
  return db.transaction(async (tx) => {
    const at = now()
    const summary = input.summary ?? ""
    const [row] = await tx
      .insert(projects)
      .values({
        id: newId("proj"),
        ownerId: userId,
        name: input.name,
        description: input.description ?? "",
        status: input.status ?? "active",
        summary,
        summaryUpdatedAt: summary ? at : null,
        createdAt: at,
        updatedAt: at,
      })
      .returning()
    await logEvent(tx, actor, {
      projectId: row.id,
      kind: "created",
      message: `Project "${row.name}" created`,
      sessionId: input.sessionId,
    })
    return row
  })
}

export async function updateProject(
  userId: string,
  input: Inputs["update"],
  actor: ProjectActor = "user"
): Promise<Project> {
  await assertProjectAccess(userId, input.id)
  return db.transaction(async (tx) => {
    const [cur] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, input.id))
      .for("update")
    if (input.ifVersion !== undefined && input.ifVersion !== cur.version)
      throw conflict("Project", cur)

    const { patch, before, changed } = diff(cur, {
      name: input.name,
      description: input.description,
      status: input.status,
      summary: input.summary,
    })
    const base = { projectId: cur.id, sessionId: input.sessionId }
    if (!changed) {
      if (input.message)
        await logEvent(tx, actor, {
          ...base,
          kind: "note",
          message: input.message,
        })
      return cur
    }

    const at = now()
    const [row] = await tx
      .update(projects)
      .set({
        ...patch,
        ...(patch.summary !== undefined && { summaryUpdatedAt: at }),
        version: cur.version + 1,
        updatedAt: at,
      })
      .where(eq(projects.id, cur.id))
      .returning()

    const parts: string[] = []
    if (patch.status) parts.push(statusChange(cur.status, patch.status))
    if (patch.summary !== undefined) parts.push("Summary updated")
    if (patch.name) parts.push(`Renamed to "${patch.name}"`)
    if (patch.description !== undefined) parts.push("Description updated")
    await logEvent(tx, actor, {
      ...base,
      kind: patch.status
        ? "status"
        : patch.summary !== undefined
          ? "summary"
          : "note",
      message: describe(parts, input.message),
      before,
    })
    return row
  })
}

export async function removeProject(
  userId: string,
  input: Inputs["remove"]
): Promise<Ok> {
  const project = await assertProjectAccess(userId, input.id)
  const at = now()
  await db
    .update(projects)
    .set({ deletedAt: at, updatedAt: at, version: project.version + 1 })
    .where(eq(projects.id, project.id))
  return OK
}

// --- workstreams ------------------------------------------------------------

const toSteps = (steps: StepInput[]): Step[] =>
  steps.map((s) => ({
    id: s.id ?? newId("step"),
    text: s.text,
    done: s.done ?? false,
  }))

/** "Done: x" when only checkboxes moved, which is the common case. */
/** Event messages are read by people, so they use the UI's words. */
const STATUS_LABEL: Record<string, string> = {
  active: "In progress",
  blocked: "Blocked",
  waiting: "Waiting",
  paused: "Paused",
  planned: "Planned",
  deferred: "Deferred",
  done: "Done",
}
const statusChange = (from: string, to: string) =>
  `Status ${STATUS_LABEL[from] ?? from} → ${STATUS_LABEL[to] ?? to}`

/** Only done toggles are history; adding or rewording steps is just editing. */
function describeSteps(old: Step[], next: Step[]): string {
  const was = new Map(old.map((s) => [s.id, s]))
  return next
    .filter((s) => was.has(s.id) && was.get(s.id)!.done !== s.done)
    .map((s) => `${s.done ? "Done" : "Reopened"}: ${s.text}`)
    .join("; ")
}

async function liveWorkstream(id: string) {
  const [row] = await db
    .select()
    .from(workstreams)
    .where(and(eq(workstreams.id, id), isNull(workstreams.deletedAt)))
    .limit(1)
  if (!row) throw new ORPCError("NOT_FOUND", { message: `No workstream ${id}` })
  return row
}

/** Workstream ids used as references must be live rows of this project. */
async function assertWorkstreamsIn(
  projectId: string,
  ids: (string | null | undefined)[]
) {
  const wanted = [...new Set(ids.filter((id): id is string => !!id))]
  if (wanted.length === 0) return
  const rows = await db
    .select({ id: workstreams.id })
    .from(workstreams)
    .where(
      and(
        inArray(workstreams.id, wanted),
        eq(workstreams.projectId, projectId),
        isNull(workstreams.deletedAt)
      )
    )
  const found = new Set(rows.map((r) => r.id))
  const missing = wanted.find((id) => !found.has(id))
  if (missing)
    throw new ORPCError("NOT_FOUND", {
      message: `No workstream ${missing} in project ${projectId}`,
    })
}

export async function getWorkstream(
  userId: string,
  id: string
): Promise<Workstream> {
  const row = await liveWorkstream(id)
  await assertProjectAccess(userId, row.projectId)
  return row
}

export async function createWorkstream(
  userId: string,
  input: Inputs["workstreamCreate"],
  actor: ProjectActor = "user"
): Promise<Workstream> {
  const project = await assertProjectAccess(userId, input.projectId)
  await assertWorkstreamsIn(project.id, input.dependsOn ?? [])
  return db.transaction(async (tx) => {
    const [last] = await tx
      .select({ position: max(workstreams.position) })
      .from(workstreams)
      .where(eq(workstreams.projectId, project.id))
    const at = now()
    const [row] = await tx
      .insert(workstreams)
      .values({
        id: newId("ws"),
        projectId: project.id,
        name: input.name,
        status: input.status ?? "planned",
        plan: input.plan ?? "",
        planState: input.planState ?? "proposed",
        steps: toSteps(input.steps ?? []),
        dependsOn: input.dependsOn ?? [],
        note: input.note ?? "",
        position: (last?.position ?? -1) + 1,
        createdAt: at,
        updatedAt: at,
      })
      .returning()
    await logEvent(tx, actor, {
      projectId: project.id,
      workstreamId: row.id,
      kind: "created",
      message: `Workstream "${row.name}" created`,
      sessionId: input.sessionId,
    })
    return row
  })
}

export async function updateWorkstream(
  userId: string,
  input: Inputs["workstreamUpdate"],
  actor: ProjectActor = "user"
): Promise<Workstream> {
  const found = await liveWorkstream(input.id)
  await assertProjectAccess(userId, found.projectId)
  await assertWorkstreamsIn(found.projectId, input.dependsOn ?? [])
  return db.transaction(async (tx) => {
    const [cur] = await tx
      .select()
      .from(workstreams)
      .where(eq(workstreams.id, input.id))
      .for("update")
    if (input.ifVersion !== undefined && input.ifVersion !== cur.version)
      throw conflict("Workstream", cur)

    const { patch, before, changed } = diff(cur, {
      name: input.name,
      status: input.status,
      plan: input.plan,
      planState: input.planState,
      steps: input.steps && toSteps(input.steps),
      dependsOn: input.dependsOn,
      note: input.note,
      position: input.position,
    })
    const base = {
      projectId: cur.projectId,
      workstreamId: cur.id,
      sessionId: input.sessionId,
    }
    if (!changed) {
      if (input.message)
        await logEvent(tx, actor, {
          ...base,
          kind: "note",
          message: input.message,
        })
      return cur
    }

    const at = now()
    const [row] = await tx
      .update(workstreams)
      .set({ ...patch, version: cur.version + 1, updatedAt: at })
      .where(eq(workstreams.id, cur.id))
      .returning()

    // A reorder alone is layout, not history.
    delete before.position
    const parts: string[] = []
    if (patch.plan !== undefined) parts.push("Plan updated")
    if (patch.planState) parts.push(`Plan ${patch.planState}`)
    if (patch.steps) {
      const toggles = describeSteps(cur.steps, patch.steps)
      if (toggles) parts.push(toggles)
      else delete before.steps
    }
    if (patch.status) parts.push(statusChange(cur.status, patch.status))
    if (patch.note !== undefined)
      parts.push(patch.note ? `Note: ${patch.note}` : "Note cleared")
    if (patch.name) parts.push(`Renamed to "${patch.name}"`)
    if (patch.dependsOn) parts.push("Dependencies updated")
    if (parts.length === 0 && !input.message) return row

    const kind: ProjectEventKind =
      patch.plan !== undefined || patch.planState
        ? "plan"
        : before.steps
          ? "steps"
          : patch.status || patch.note !== undefined
            ? "status"
            : "note"
    await logEvent(tx, actor, {
      ...base,
      kind,
      message: describe(
        parts.length ? [`${cur.name}: ${parts.join("; ")}`] : [],
        input.message
      ),
      before,
    })
    return row
  })
}

export async function removeWorkstream(
  userId: string,
  input: Inputs["workstreamRemove"],
  actor: ProjectActor = "user"
): Promise<Ok> {
  const ws = await liveWorkstream(input.id)
  await assertProjectAccess(userId, ws.projectId)
  await db.transaction(async (tx) => {
    const at = now()
    await tx
      .update(workstreams)
      .set({ deletedAt: at, updatedAt: at, version: ws.version + 1 })
      .where(eq(workstreams.id, ws.id))
    await logEvent(tx, actor, {
      projectId: ws.projectId,
      workstreamId: ws.id,
      kind: "note",
      message: `Workstream "${ws.name}" removed`,
      sessionId: input.sessionId,
    })
  })
  return OK
}

// --- decisions and blockers -------------------------------------------------

export async function createDecision(
  userId: string,
  input: Inputs["decisionCreate"],
  actor: ProjectActor = "user"
): Promise<ProjectDecision> {
  const project = await assertProjectAccess(userId, input.projectId)
  await assertWorkstreamsIn(project.id, [input.workstreamId])
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(projectDecisions)
      .values({
        id: newId("dec"),
        projectId: project.id,
        workstreamId: input.workstreamId ?? null,
        kind: input.kind,
        title: input.title,
        body: input.body ?? "",
        createdAt: now(),
        sessionId: input.sessionId ?? null,
      })
      .returning()
    await logEvent(tx, actor, {
      projectId: project.id,
      workstreamId: row.workstreamId,
      kind: row.kind,
      message: `${row.kind === "blocker" ? "Blocker" : "Decision needed"}: ${row.title}`,
      sessionId: input.sessionId,
    })
    return row
  })
}

export async function updateDecision(
  userId: string,
  input: Inputs["decisionUpdate"],
  actor: ProjectActor = "user"
): Promise<ProjectDecision> {
  const [cur] = await db
    .select()
    .from(projectDecisions)
    .where(
      and(eq(projectDecisions.id, input.id), isNull(projectDecisions.deletedAt))
    )
    .limit(1)
  if (!cur)
    throw new ORPCError("NOT_FOUND", { message: `No decision ${input.id}` })
  await assertProjectAccess(userId, cur.projectId)

  const { patch, changed } = diff(cur, {
    title: input.title,
    body: input.body,
    status: input.status,
    resolution: input.resolution,
  })
  if (!changed) return cur

  return db.transaction(async (tx) => {
    const at = now()
    const resolvedAt =
      patch.status === "resolved"
        ? at
        : patch.status === "open"
          ? null
          : undefined
    const [row] = await tx
      .update(projectDecisions)
      .set({ ...patch, ...(resolvedAt !== undefined && { resolvedAt }) })
      .where(eq(projectDecisions.id, cur.id))
      .returning()

    if (patch.status || patch.resolution !== undefined) {
      const message =
        row.status === "resolved"
          ? `Resolved: ${row.title}${row.resolution ? ` — ${row.resolution}` : ""}`
          : `Reopened: ${row.title}`
      await logEvent(tx, actor, {
        projectId: row.projectId,
        workstreamId: row.workstreamId,
        kind: row.kind,
        message,
        before: { status: cur.status, resolution: cur.resolution },
        sessionId: input.sessionId,
      })
    }
    return row
  })
}

// --- cards ------------------------------------------------------------------

export async function linkCard(
  userId: string,
  input: Inputs["cardLink"],
  actor: ProjectActor = "user"
): Promise<Ok> {
  const project = await assertProjectAccess(userId, input.projectId)
  await assertWorkstreamsIn(project.id, [input.workstreamId])
  if ((await boardAccess(userId, input.boardId)) === "denied")
    throw new ORPCError("FORBIDDEN")

  const [card] = await db
    .select({ title: cards.title, number: cards.number })
    .from(cards)
    .where(
      and(
        eq(cards.id, input.cardId),
        eq(cards.boardId, input.boardId),
        isNull(cards.deletedAt)
      )
    )
    .limit(1)
  if (!card)
    throw new ORPCError("NOT_FOUND", {
      message: `No card ${input.cardId} on board ${input.boardId}`,
    })

  await db.transaction(async (tx) => {
    const workstreamId = input.workstreamId ?? null
    await tx
      .insert(projectCards)
      .values({
        projectId: project.id,
        boardId: input.boardId,
        cardId: input.cardId,
        workstreamId,
        createdAt: now(),
      })
      .onConflictDoUpdate({
        target: [projectCards.projectId, projectCards.cardId],
        set: { boardId: input.boardId, workstreamId },
      })
    await logEvent(tx, actor, {
      projectId: project.id,
      workstreamId,
      kind: "card",
      message: `Linked card ${card.number ? `#${card.number} ` : ""}${card.title}`,
      sessionId: input.sessionId,
    })
  })
  return OK
}

export async function unlinkCard(
  userId: string,
  input: Inputs["cardUnlink"],
  actor: ProjectActor = "user"
): Promise<Ok> {
  const project = await assertProjectAccess(userId, input.projectId)
  await db.transaction(async (tx) => {
    const [gone] = await tx
      .delete(projectCards)
      .where(
        and(
          eq(projectCards.projectId, project.id),
          eq(projectCards.cardId, input.cardId)
        )
      )
      .returning()
    if (!gone) return
    const [card] = await tx
      .select({ title: cards.title })
      .from(cards)
      .where(eq(cards.id, gone.cardId))
    await logEvent(tx, actor, {
      projectId: project.id,
      workstreamId: gone.workstreamId,
      kind: "card",
      message: `Unlinked card ${card?.title ?? gone.cardId}`,
      before: { boardId: gone.boardId, workstreamId: gone.workstreamId },
      sessionId: input.sessionId,
    })
  })
  return OK
}

// --- sessions ---------------------------------------------------------------

export async function registerSession(
  userId: string,
  input: Inputs["sessionRegister"],
  actor: ProjectActor = "user"
): Promise<ProjectSession> {
  const project = await assertProjectAccess(userId, input.projectId)
  await assertWorkstreamsIn(project.id, [input.workstreamId])
  return db.transaction(async (tx) => {
    const at = now()
    const fields = {
      workstreamId: input.workstreamId,
      label: input.label,
      mission: input.mission,
      branch: input.branch,
      repoId: input.repoId,
      claudeSessionId: input.claudeSessionId,
      dashboardUrl: input.dashboardUrl,
      lastEvent: input.lastEvent,
    }
    const [cur] = await tx
      .select()
      .from(projectSessions)
      .where(
        and(
          eq(projectSessions.projectId, project.id),
          eq(projectSessions.worktree, input.worktree)
        )
      )
      .for("update")

    // Only the session itself (via MCP) proves it is alive; a row the operator
    // adds by hand is a pointer, not activity.
    const active = actor === "mcp" || input.lastEvent !== undefined
    let row: ProjectSession
    let message: string | undefined
    if (cur) {
      const { patch } = diff(cur, fields)
      ;[row] = await tx
        .update(projectSessions)
        .set({
          ...patch,
          ...(active && { lastActivityAt: at }),
          updatedAt: at,
          deletedAt: null,
        })
        .where(eq(projectSessions.id, cur.id))
        .returning()
      // Heartbeats are not history; a new Claude session or a comeback is.
      if (cur.deletedAt !== null) message = `Session "${row.label}" rejoined`
      else if (patch.claudeSessionId) message = `Session "${row.label}" started`
    } else {
      ;[row] = await tx
        .insert(projectSessions)
        .values({
          ...fields,
          id: newId("sess"),
          projectId: project.id,
          worktree: input.worktree,
          label: input.label || input.mission || basename(input.worktree),
          lastActivityAt: active ? at : null,
          createdAt: at,
          updatedAt: at,
        })
        .returning()
      message = `Session "${row.label}" joined`
    }

    if (message)
      await logEvent(tx, actor, {
        projectId: project.id,
        workstreamId: row.workstreamId,
        kind: "session",
        message,
        sessionId: input.sessionId ?? (active ? row.id : null),
      })
    return row
  })
}

export async function removeSession(
  userId: string,
  input: Inputs["sessionRemove"],
  actor: ProjectActor = "user"
): Promise<Ok> {
  const [cur] = await db
    .select()
    .from(projectSessions)
    .where(
      and(eq(projectSessions.id, input.id), isNull(projectSessions.deletedAt))
    )
    .limit(1)
  if (!cur)
    throw new ORPCError("NOT_FOUND", { message: `No session ${input.id}` })
  await assertProjectAccess(userId, cur.projectId)

  await db.transaction(async (tx) => {
    const at = now()
    await tx
      .update(projectSessions)
      .set({ deletedAt: at, updatedAt: at })
      .where(eq(projectSessions.id, cur.id))
    await logEvent(tx, actor, {
      projectId: cur.projectId,
      workstreamId: cur.workstreamId,
      kind: "session",
      message: `Session "${cur.label}" removed`,
      sessionId: input.sessionId ?? cur.id,
    })
  })
  return OK
}

// --- notes ------------------------------------------------------------------

export async function addNote(
  userId: string,
  input: Inputs["noteAdd"],
  actor: ProjectActor = "user"
): Promise<ProjectEvent> {
  const project = await assertProjectAccess(userId, input.projectId)
  await assertWorkstreamsIn(project.id, [input.workstreamId])
  return db.transaction((tx) =>
    logEvent(tx, actor, {
      projectId: project.id,
      workstreamId: input.workstreamId,
      kind: "note",
      message: input.message,
      sessionId: input.sessionId,
    })
  )
}
