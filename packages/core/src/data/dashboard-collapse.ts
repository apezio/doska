import { useSyncExternalStore } from "react"
import { runtime } from "../runtime"

const COLLAPSED_DASHBOARDS_KEY = "doska:collapsed-dashboards"

const NONE: ReadonlySet<string> = new Set()

// Storage is the cross-session copy, not something to re-read every render.
let collapsed: ReadonlySet<string> | null = null

const listeners = new Set<() => void>()

function load(): ReadonlySet<string> {
  if (collapsed) return collapsed
  try {
    const parsed = JSON.parse(
      runtime().kv.get(COLLAPSED_DASHBOARDS_KEY) ?? "[]"
    ) as unknown
    collapsed = new Set(
      Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : []
    )
  } catch {
    // Unreadable storage is not worth failing a render over.
    collapsed = NONE
  }
  return collapsed
}

function save(next: ReadonlySet<string>): void {
  collapsed = next
  runtime().kv.set(COLLAPSED_DASHBOARDS_KEY, JSON.stringify([...next]))
  for (const listener of [...listeners]) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Folds board `id`'s subtree away in the sidebar, or unfolds it again. */
export function toggleDashboardCollapsed(id: string): void {
  const next = new Set(load())
  if (!next.delete(id)) next.add(id)
  save(next)
}

/** Unfolds every board in `ids`; a no-op when none of them is folded. */
export function expandDashboards(ids: string[]): void {
  const current = load()
  if (!ids.some((id) => current.has(id))) return
  save(new Set([...current].filter((id) => !ids.includes(id))))
}

/** The boards this device shows folded in the sidebar, remembered across launches. */
export function useCollapsedDashboards(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, load, () => NONE)
}
