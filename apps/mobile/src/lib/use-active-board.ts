import type { Dashboard } from "@doska/core/types"
import { useDashboards } from "@doska/core/queries"
import { useSyncExternalStore } from "react"
import { mobileKeyValue } from "./adapters/mobile-kv"

/** The board that was open most recently — the same key the web client uses. */
const LAST_BOARD_KEY = "doska:last-board"

// The sidebar picks the board and the board screen shows it, so the selection
// lives outside both rather than in either one's state. Storage is the
// cross-session copy, not something to re-read every render.
let selected = mobileKeyValue.get(LAST_BOARD_KEY)
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function selectBoard(id: string): void {
  selected = id
  mobileKeyValue.set(LAST_BOARD_KEY, id)
  for (const listener of [...listeners]) listener()
}

/** Which board the screen is showing, remembered across launches. */
export function useActiveBoard(): {
  dashboards: Dashboard[]
  board: Dashboard | null
  deckId: string | null
  isPending: boolean
  select: (id: string) => void
} {
  const { data: dashboards = [], isPending } = useDashboards()
  const id = useSyncExternalStore(subscribe, () => selected)

  // Resolved against the live list: a board deleted on another device must not
  // strand the screen on an id that no longer exists.
  const active =
    dashboards.find((dashboard) => dashboard.id === id) ?? dashboards[0] ?? null

  return {
    dashboards,
    board: active,
    deckId: active?.id ?? null,
    isPending,
    select: selectBoard,
  }
}
