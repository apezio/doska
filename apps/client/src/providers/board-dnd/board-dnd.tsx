import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { DragDropContext } from "@hello-pangea/dnd"
import { DragStateProvider } from "@/components/deck/drag-state"
import {
  BOARD_DROP_ATTR,
  BoardUnderPointerCtx,
  RegisterDropCtx,
  type DropHandler,
} from "./board-dnd-context"

/** The board whose sidebar row is under this point, if any. */
function boardAt(x: number, y: number): string | null {
  // The card being dragged has `pointer-events: none`, so this reads what is
  // underneath it rather than the card itself.
  const row = document.elementFromPoint(x, y)?.closest(`[${BOARD_DROP_ATTR}]`)
  return row?.getAttribute(BOARD_DROP_ATTR) ?? null
}

/**
 * The one drag context for the whole app. It lives above the sidebar rather
 * than inside the board because a card dragged onto another board has to cross
 * that boundary.
 *
 * The sidebar rows are deliberately not droppables: a droppable opens a gap for
 * the card and inflates its own hit box by the card's height, which made the
 * rows jump and the top one swallow the drops meant for the rest. They are
 * plain rows, and the board under the pointer is what a drop lands on.
 */
export function BoardDndProvider({ children }: { children: ReactNode }) {
  const [isDragging, setIsDragging] = useState(false)
  const [overBoard, setOverBoard] = useState<string | null>(null)
  const handler = useRef<DropHandler | null>(null)
  // The drop reads the last pointer position, which `mouseup` doesn't carry.
  const overBoardRef = useRef<string | null>(null)

  const register = useCallback((next: DropHandler | null) => {
    handler.current = next
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const track = (event: MouseEvent | TouchEvent) => {
      const point = "touches" in event ? event.touches[0] : event
      if (!point) return
      const board = boardAt(point.clientX, point.clientY)
      overBoardRef.current = board
      setOverBoard(board)
    }

    window.addEventListener("mousemove", track, true)
    window.addEventListener("touchmove", track, true)
    return () => {
      window.removeEventListener("mousemove", track, true)
      window.removeEventListener("touchmove", track, true)
    }
  }, [isDragging])

  return (
    <RegisterDropCtx.Provider value={register}>
      <BoardUnderPointerCtx.Provider value={overBoard}>
        <DragStateProvider value={isDragging}>
          <DragDropContext
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(result) => {
              setIsDragging(false)
              const board = overBoardRef.current
              overBoardRef.current = null
              setOverBoard(null)
              handler.current?.(result, board)
            }}
          >
            {children}
          </DragDropContext>
        </DragStateProvider>
      </BoardUnderPointerCtx.Provider>
    </RegisterDropCtx.Provider>
  )
}
