import { generateKeyBetween } from "fractional-indexing"
import type { Dashboard } from "../types"
import { byPosition } from "./position"

/** One sidebar row: the board and how deep it sits under its ancestors. */
export type DashboardRow = { dashboard: Dashboard; depth: number }

/** The board a dashboard nests under, for records written before nesting existed. */
export function parentOf(dashboard: Dashboard): string | null {
  return dashboard.parentId ?? null
}

/**
 * Lays the boards out as the sidebar shows them: siblings by `position`, each
 * board's children right under it, indented one level deeper. A board whose
 * parent is missing from the list (deleted, or not shared with this account)
 * is shown at the top level rather than hidden, and a cycle — which the move
 * operation refuses, but sync can still stitch together — is broken at the
 * first repeat, so every live board appears exactly once.
 */
export function flattenDashboards(dashboards: Dashboard[]): DashboardRow[] {
  const ids = new Set(dashboards.map((d) => d.id))
  const children = new Map<string | null, Dashboard[]>()
  for (const d of dashboards) {
    const parent = parentOf(d)
    const key = parent !== null && ids.has(parent) ? parent : null
    const list = children.get(key) ?? []
    list.push(d)
    children.set(key, list)
  }
  for (const list of children.values()) list.sort(byPosition)

  const rows: DashboardRow[] = []
  const seen = new Set<string>()
  const walk = (parent: string | null, depth: number) => {
    for (const d of children.get(parent) ?? []) {
      if (seen.has(d.id)) continue
      seen.add(d.id)
      rows.push({ dashboard: d, depth })
      walk(d.id, depth + 1)
    }
  }
  walk(null, 0)

  // Boards only reachable through a cycle — none of them has a root to hang
  // from, so they surface at the top level in position order.
  for (const d of [...dashboards].sort(byPosition)) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    rows.push({ dashboard: d, depth: 0 })
    walk(d.id, 1)
  }
  return rows
}

/** True when `candidate` is `id` itself or sits anywhere below it. */
export function isSelfOrDescendant(
  dashboards: Dashboard[],
  id: string,
  candidate: string
): boolean {
  const byId = new Map(dashboards.map((d) => [d.id, d]))
  const seen = new Set<string>()
  let cursor: string | null = candidate
  while (cursor !== null && !seen.has(cursor)) {
    if (cursor === id) return true
    seen.add(cursor)
    const d = byId.get(cursor)
    cursor = d ? parentOf(d) : null
  }
  return false
}

/** Where a board is going: its new parent and its place among the siblings. */
export type DashboardMove = { id: string; parentId: string | null; position: string }

/** Appends `id` as the last child of `parentId` (null = end of the top level). */
export function moveToParent(
  dashboards: Dashboard[],
  id: string,
  parentId: string | null
): DashboardMove | null {
  if (parentId !== null && isSelfOrDescendant(dashboards, id, parentId)) {
    return null
  }
  const siblings = dashboards
    .filter((d) => d.id !== id && parentOf(d) === parentId)
    .sort(byPosition)
  const last = siblings[siblings.length - 1]
  return {
    id,
    parentId,
    position: generateKeyBetween(last?.position ?? null, null),
  }
}

/**
 * Resolves a reorder drop: the sidebar is one flat list, so a board dropped at
 * `index` (counted with the moved board taken out) lands next to whatever rows
 * surround that slot. It joins the row *after* the slot as a sibling — that is
 * what puts a board dropped just under a parent into the parent's group, and a
 * board dropped just past the group's last child back at the top level. At the
 * very end of the list it goes to the end of the top level.
 */
export function moveToIndex(
  dashboards: Dashboard[],
  id: string,
  index: number
): DashboardMove | null {
  const rows = flattenDashboards(dashboards).filter((r) => r.dashboard.id !== id)
  const next = rows[index]?.dashboard
  const parentId = next ? parentOf(next) : null
  if (parentId !== null && isSelfOrDescendant(dashboards, id, parentId)) {
    return null
  }
  const siblings = dashboards
    .filter((d) => d.id !== id && parentOf(d) === parentId)
    .sort(byPosition)
  const at = next ? siblings.findIndex((d) => d.id === next.id) : siblings.length
  const before = siblings[at - 1]
  const after = siblings[at]
  return {
    id,
    parentId,
    position: generateKeyBetween(
      before?.position ?? null,
      after?.position ?? null
    ),
  }
}

/**
 * The board list as it reads once `move` lands: only the moved board's record
 * changes — its children follow it by reference, exactly as the write does —
 * and the list stays in the flat position order `getDashboards` hands out.
 */
export function applyMove(
  dashboards: Dashboard[],
  { id, parentId, position }: DashboardMove
): Dashboard[] {
  return dashboards
    .map((d) => (d.id === id ? { ...d, parentId, position } : d))
    .sort(byPosition)
}
