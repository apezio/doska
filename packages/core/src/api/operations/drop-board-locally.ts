import { keys } from "../../data/keys"
import { queryClient } from "../../query-client"
import { CARDS, COLUMNS, DASHBOARDS } from "../constants"
import { db } from "../db/db"
import { sync } from "../sync/sync-engine"
import { boardCursorKey } from "../sync/drivers/board-driver"
import { clearCursor } from "../sync/drivers/channel-shared"
import { purgeBoard } from "../sync/drivers/dashboard-channel"

/**
 * Removes every local trace of a board the server won't serve us: its row, its
 * contents, its pull cursor, and its dirty refs.
 */
export async function dropBoardLocally(boardId: string): Promise<void> {
  const columns = (await db.getColumns()).filter(
    (column) => column.dashboardId === boardId
  )
  const cards = (
    await Promise.all(columns.map((column) => db.getCards(column.id)))
  ).flat()

  sync.dropDirty(DASHBOARDS, [boardId])
  sync.dropDirty(
    COLUMNS,
    columns.map((column) => column.id)
  )
  sync.dropDirty(
    CARDS,
    cards.map((card) => card.id)
  )

  await purgeBoard(boardId)
  await db.hardDelete(DASHBOARDS, boardId)
  await clearCursor(boardCursorKey(boardId))

  queryClient.invalidateQueries({ queryKey: keys.dashboards })
  queryClient.invalidateQueries({ queryKey: keys.digest })
  queryClient.invalidateQueries({ queryKey: keys.trash })
}
