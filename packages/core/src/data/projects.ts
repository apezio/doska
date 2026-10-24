import type {
  ProjectDecision,
  ProjectSummary,
  Workstream,
} from "@doska/contract"

export {
  conflictVersion,
  isConflict,
  isGone,
  type ProjectWrite,
  type ProjectWriteInput,
} from "../api/projects"

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "just now", "5m ago", "3h ago", "yesterday", "4d ago", then a plain date. */
export function timeAgo(at: number, now = Date.now()): string {
  const ms = Math.max(0, now - at)
  if (ms < MINUTE) return "just now"
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m ago`
  if (ms < DAY) return `${Math.floor(ms / HOUR)}h ago`
  if (ms < 2 * DAY) return "yesterday"
  if (ms < 7 * DAY) return `${Math.floor(ms / DAY)}d ago`
  const d = new Date(at)
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year:
      d.getFullYear() === new Date(now).getFullYear() ? undefined : "numeric",
  })
}

export type ProjectGroupId = "attention" | "moving" | "resting"

export interface ProjectGroup {
  id: ProjectGroupId
  projects: ProjectSummary[]
}

/** Something on the project waits on its owner, whatever its status says. */
export function needsAttention(p: ProjectSummary): boolean {
  return (
    p.status === "blocked" ||
    p.status === "waiting" ||
    p.openDecisions > 0 ||
    p.openBlockers > 0
  )
}

function groupOf(p: ProjectSummary): ProjectGroupId {
  if (needsAttention(p) && p.status !== "done") return "attention"
  if (p.status === "active") return "moving"
  return "resting"
}

const GROUP_ORDER: ProjectGroupId[] = ["attention", "moving", "resting"]

/**
 * The overview's order: what waits on the owner first, then what is moving,
 * then paused and done. Most recently active first within each; empty groups
 * are left out.
 */
export function groupProjects(projects: ProjectSummary[]): ProjectGroup[] {
  const sorted = [...projects].sort(
    (a, b) => b.lastActivityAt - a.lastActivityAt
  )
  return GROUP_ORDER.map((id) => ({
    id,
    projects: sorted.filter((p) => groupOf(p) === id),
  })).filter((g) => g.projects.length > 0)
}

/** The dependencies of `ws` that are not done yet, in their own order. */
export function pendingDependencies(
  ws: Workstream,
  all: Workstream[]
): Workstream[] {
  const byId = new Map(all.map((w) => [w.id, w]))
  return ws.dependsOn
    .map((id) => byId.get(id))
    .filter((w): w is Workstream => w !== undefined && w.status !== "done")
}

export interface Attention {
  decisions: ProjectDecision[]
  blockers: ProjectDecision[]
  /** Workstreams held up on something outside themselves. */
  stalled: Workstream[]
}

export function attentionOf(
  decisions: ProjectDecision[],
  workstreams: Workstream[]
): Attention {
  const open = decisions.filter((d) => d.status === "open")
  return {
    decisions: open.filter((d) => d.kind === "decision"),
    blockers: open.filter((d) => d.kind === "blocker"),
    stalled: workstreams.filter(
      (w) => w.status === "waiting" || w.status === "blocked"
    ),
  }
}

/** The server's window for counting a session as active. */
const LIVE_MS = DAY

export function isLive(lastActivityAt: number | null, now = Date.now()) {
  return lastActivityAt !== null && now - lastActivityAt < LIVE_MS
}
