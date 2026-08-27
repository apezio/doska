import { useSyncExternalStore } from "react"
import { runtime } from "../runtime"

const COLUMN_WIDTHS_KEY = "doska:column-widths"

/** What a column measures until someone drags it — Tailwind's `max-w-sm`. */
export const DEFAULT_COLUMN_WIDTH = 384
/** Narrower than this and a card's title wraps to uselessness. */
export const MIN_COLUMN_WIDTH = 240
/** Wider than this and one column pushes the rest off the board. */
export const MAX_COLUMN_WIDTH = 720

/**
 * The width a column may actually take: the caller's number squeezed into
 * [{@link MIN_COLUMN_WIDTH}, {@link MAX_COLUMN_WIDTH}], and then into whatever
 * `room` the viewport leaves. A `room` below the minimum loses to the minimum —
 * a column stays readable even on a screen with no space for it.
 */
export function clampColumnWidth(width: number, room = Infinity): number {
  if (!Number.isFinite(width)) return DEFAULT_COLUMN_WIDTH
  const max = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, room))
  return Math.round(Math.min(Math.max(width, MIN_COLUMN_WIDTH), max))
}

// Storage is the cross-session copy, not something to re-read every render.
let widths: Record<string, number> | null = null

const listeners = new Set<() => void>()

function load(): Record<string, number> {
  if (widths) return widths
  const stored = runtime().kv.get(COLUMN_WIDTHS_KEY)
  try {
    const parsed = stored ? (JSON.parse(stored) as unknown) : {}
    widths = {}
    // A hand-edited or half-written store shouldn't put a column at NaN pixels.
    for (const [id, value] of Object.entries(parsed as object))
      if (typeof value === "number" && Number.isFinite(value))
        widths[id] = clampColumnWidth(value)
  } catch {
    // Unreadable storage is not worth failing a render over.
    widths = {}
  }
  return widths
}

function save(next: Record<string, number>): void {
  widths = next
  runtime().kv.set(COLUMN_WIDTHS_KEY, JSON.stringify(next))
  for (const listener of [...listeners]) listener()
}

/** Calls `listener` whenever any column's width changes. Returns the unsubscribe. */
export function subscribeColumnWidths(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** How wide column `id` is stored as — the non-React read behind the hook. */
export function readColumnWidth(id: string): number {
  return load()[id] ?? DEFAULT_COLUMN_WIDTH
}

/** Remembers how wide this device shows column `id`. */
export function setColumnWidth(id: string, width: number): void {
  const current = load()
  const next = clampColumnWidth(width)
  if (current[id] === next) return
  save({ ...current, [id]: next })
}

/** Forgets column `id`'s width, putting it back to {@link DEFAULT_COLUMN_WIDTH}. */
export function resetColumnWidth(id: string): void {
  const current = load()
  if (!(id in current)) return
  const next = { ...current }
  delete next[id]
  save(next)
}

/** How wide this device shows column `id`, remembered across launches. */
export function useColumnWidth(id: string): number {
  return useSyncExternalStore(
    subscribeColumnWidths,
    () => readColumnWidth(id),
    () => DEFAULT_COLUMN_WIDTH
  )
}
