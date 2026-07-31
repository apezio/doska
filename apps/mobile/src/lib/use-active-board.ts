import type { Dashboard } from "@doska/core/types"
import { useDashboards } from "@doska/core/queries"
import { useState } from "react"
import { mobileKeyValue } from "./adapters/mobile-kv"

/** The board that was open most recently — the same key the web client uses. */
const LAST_BOARD_KEY = "doska:last-board"

/**
 * Which board the screen is showing, remembered across launches. The full
 * switcher is Phase 4's; this is the minimum needed to reach a second board,
 * which is what verifying a round trip against another device requires.
 */
export function useActiveBoard(): {
  dashboards: Dashboard[]
  deckId: string | null
  select: (id: string) => void
} {
  const { data: dashboards = [] } = useDashboards()

  // Storage is the cross-session copy, not something to re-read every render.
  const [selected, setSelected] = useState(() =>
    mobileKeyValue.get(LAST_BOARD_KEY)
  )

  // Resolved against the live list: a board deleted on another device must not
  // strand the screen on an id that no longer exists.
  const active =
    dashboards.find((dashboard) => dashboard.id === selected) ?? dashboards[0]

  return {
    dashboards,
    deckId: active?.id ?? null,
    select: (id) => {
      setSelected(id)
      mobileKeyValue.set(LAST_BOARD_KEY, id)
    },
  }
}
