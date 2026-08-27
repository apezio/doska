import { createContext, useContext, useEffect, useRef } from "react"
import type { DropResult } from "@hello-pangea/dnd"

/**
 * A drop takes the drag result and, when the card was let go over a board in
 * the sidebar, that board's id.
 */
export type DropHandler = (
  result: DropResult,
  boardUnderPointer: string | null
) => void

export const RegisterDropCtx = createContext<
  (handler: DropHandler | null) => void
>(() => {})

/** The board the pointer is over, for the sidebar row to show it is the target. */
export const BoardUnderPointerCtx = createContext<string | null>(null)

export function useBoardUnderPointer() {
  return useContext(BoardUnderPointerCtx)
}

/** Marks a sidebar row as somewhere a card can be dropped. */
export const BOARD_DROP_ATTR = "data-board-drop-target"

/** Registers the board's drop handler with the app-wide drag context. */
export function useOnBoardDrop(onDrop: DropHandler) {
  const register = useContext(RegisterDropCtx)
  // Read through a ref so a handler rebuilt each render doesn't re-register.
  const latest = useRef(onDrop)

  useEffect(() => {
    latest.current = onDrop
  })

  useEffect(() => {
    register((...args) => latest.current(...args))
    return () => register(null)
  }, [register])
}
