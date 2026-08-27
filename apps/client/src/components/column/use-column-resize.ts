import { useCallback, useEffect, useRef, useState } from "react"
import {
  clampColumnWidth,
  resetColumnWidth,
  setColumnWidth,
  useColumnWidth,
} from "@doska/core/column-widths"

/** Board chrome that has to stay reachable however wide a column is dragged. */
const MIN_BOARD_MARGIN = 96

/** The widest a column may be on this screen right now. */
function room(): number {
  return typeof window === "undefined"
    ? Infinity
    : window.innerWidth - MIN_BOARD_MARGIN
}

export interface ColumnResize {
  /** Pixels, already clamped — what the column should render at. */
  width: number
  isResizing: boolean
  /** Begins a pointer drag from `clientX`, the point the handle was grabbed at. */
  onStartResizing: (clientX: number) => void
  /** Nudges the width by `delta` px, for the handle's arrow keys. */
  onNudge: (delta: number) => void
  /** Puts the column back to the default width. */
  onReset: () => void
}

/**
 * Drag-to-resize for one column. Unlike the card panel, a column is not pinned
 * to a screen edge, so the drag tracks the pointer's travel from where it was
 * grabbed rather than its absolute position.
 *
 * The width in flight is local state, committed to storage only once the drag
 * settles: a board can hold a dozen columns, and every pointermove writing
 * through to `localStorage` would be felt.
 */
export function useColumnResize(id: string): ColumnResize {
  const stored = useColumnWidth(id)
  const [dragged, setDragged] = useState<number | null>(null)
  const origin = useRef({ clientX: 0, width: 0 })
  const latest = useRef(0)
  // `room()` reads the viewport during render, so a window resize has to ask
  // for a fresh one — otherwise a shrunk screen keeps the old, too-wide column.
  const [, remeasure] = useState(0)

  useEffect(() => {
    const onResize = () => remeasure((n) => n + 1)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const isResizing = dragged !== null
  const width = clampColumnWidth(dragged ?? stored, room())

  const onStartResizing = useCallback(
    (clientX: number) => {
      const from = clampColumnWidth(stored, room())
      origin.current = { clientX, width: from }
      latest.current = from
      setDragged(from)
    },
    [stored]
  )

  useEffect(() => {
    if (!isResizing) return

    const onPointerMove = (e: PointerEvent) => {
      const { clientX, width: from } = origin.current
      latest.current = clampColumnWidth(from + (e.clientX - clientX), room())
      setDragged(latest.current)
    }
    const stop = () => {
      // A click that never moved shouldn't write anything — it would pin the
      // default width into storage for a column nobody meant to resize.
      if (latest.current !== origin.current.width)
        setColumnWidth(id, latest.current)
      setDragged(null)
    }

    // The pointer spends the drag over the board, which would otherwise select text.
    const { userSelect, cursor } = document.body.style
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", stop)
    window.addEventListener("pointercancel", stop)
    return () => {
      document.body.style.userSelect = userSelect
      document.body.style.cursor = cursor
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", stop)
      window.removeEventListener("pointercancel", stop)
    }
  }, [id, isResizing])

  const onNudge = useCallback(
    (delta: number) => setColumnWidth(id, clampColumnWidth(stored + delta)),
    [id, stored]
  )

  const onReset = useCallback(() => resetColumnWidth(id), [id])

  return { width, isResizing, onStartResizing, onNudge, onReset }
}
