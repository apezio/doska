import type { DropResult } from "@hello-pangea/dnd"
import type { Board, Card } from "@doska/core/types"
import { byPosition, keyBetween } from "@doska/core/utils"

/**
 * Builds the drop handler for the board: translates a drag result into the
 * single moved card with a freshly minted fractional position, then persists it.
 */
export function useDragEnd(
  board: Board | undefined,
  moveCard: (changed: Card[]) => void
) {
  return function handleDragEnd({
    source,
    destination,
    draggableId,
  }: DropResult) {
    if (!destination || !board) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    const moved = board.cards.find((c) => c.id === draggableId)
    if (!moved) return

    // The destination column as rendered, minus the card being dropped, so the
    // insertion index lines up with the neighbors at the drop site.
    const destCards = board.cards
      .filter(
        (c) => c.columnId === destination.droppableId && c.id !== moved.id
      )
      .sort(byPosition)

    // Mint a key strictly between the neighbors — only the moved card changes,
    // so concurrent reorders of other cards never collide with this write.
    const position = keyBetween(
      destCards[destination.index - 1],
      destCards[destination.index]
    )
    if (position === null) return

    moveCard([{ ...moved, columnId: destination.droppableId, position }])
  }
}
