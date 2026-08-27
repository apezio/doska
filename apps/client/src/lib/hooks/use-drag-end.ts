import type { DropResult } from "@hello-pangea/dnd"
import type { Board, Card } from "@doska/core/types"
import {
  byPosition,
  dropNeighbours,
  keyBetween,
  sortCards,
} from "@doska/core/utils"

/**
 * Builds the drop handler for the board: translates a drag result into the
 * single moved card with a freshly minted fractional position, then persists it.
 */
export function useDragEnd(
  board: Board | undefined,
  moveCard: (changed: Card[]) => void,
  sort: string[],
  moveCardToBoard: (vars: { id: string; boardId: string }) => void
) {
  return function handleDragEnd(
    { source, destination, draggableId }: DropResult,
    /** The board whose sidebar row the card was let go over, if any. */
    boardUnderPointer: string | null = null
  ) {
    if (!board) return

    // Let go over another board in the sidebar. That row is not a droppable —
    // see BoardDndProvider — so this arrives beside the drag result.
    if (boardUnderPointer) {
      const card = board.cards.find((c) => c.id === draggableId)
      if (card) moveCardToBoard({ id: card.id, boardId: boardUnderPointer })
      return
    }

    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    const moved = board.cards.find((c) => c.id === draggableId)
    if (!moved) return

    // The destination column as rendered, minus the card being dropped, so the
    // insertion index lines up with the neighbors at the drop site.
    const destCards = sortCards(
      board.cards
        .filter(
          (c) => c.columnId === destination.droppableId && c.id !== moved.id
        )
        .sort(byPosition),
      sort
    )

    const [prev, next] = dropNeighbours(
      destCards,
      destination.index,
      moved,
      sort
    )

    const position = keyBetween(prev, next)
    if (position === null) return

    moveCard([{ ...moved, columnId: destination.droppableId, position }])
  }
}
