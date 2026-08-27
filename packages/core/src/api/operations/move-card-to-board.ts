import { getBoard } from "./get-board"
import { moveCardToColumn } from "./move-card-to-column"

/**
 * Moves a card to another board, landing it at the top of that board's first
 * column — a drag onto a board in the sidebar names a destination board, never
 * a column, so the column is picked here.
 */
export async function moveCardToBoard(
  id: string,
  boardId: string
): Promise<void> {
  // `getBoard` returns the columns already sorted by position.
  const [first] = (await getBoard(boardId)).columns
  if (!first) return
  await moveCardToColumn(id, first.id)
}
