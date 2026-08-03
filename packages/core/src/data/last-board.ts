import { useSyncExternalStore } from "react"
import { runtime } from "../runtime"

const LAST_BOARD_KEY = "doska:last-board"

// Storage is the cross-session copy, not something to re-read every render.
let selected: string | null = null
let loaded = false

const listeners = new Set<() => void>()

function snapshot(): string | null {
  if (!loaded) {
    selected = runtime().kv.get(LAST_BOARD_KEY)
    loaded = true
  }
  return selected
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setLastBoard(id: string): void {
  if (id === snapshot()) return
  selected = id
  runtime().kv.set(LAST_BOARD_KEY, id)
  for (const listener of [...listeners]) listener()
}

/** The board that was open most recently, remembered across launches. */
export function useLastBoard(): string | null {
  return useSyncExternalStore(subscribe, snapshot)
}
