import { createContext, useContext } from "react"

/**
 * Lets a column tell the board it is being resized. The board suppresses snap
 * scrolling while that is true, for the same reason it does during a card drag:
 * snapping fights a pointer that is dragging a column edge.
 *
 * A no-op by default, so a column rendered outside a board (the public board)
 * needs no provider.
 */
const ResizeStateCtx = createContext<(isResizing: boolean) => void>(() => {})

export const ResizeStateProvider = ResizeStateCtx.Provider

/** Reports this column's resize state up to the board. */
export function useReportResizing() {
  return useContext(ResizeStateCtx)
}
