import type { Card, Column } from "../../types"
import { addDays, byPosition, todayIso } from "../../utils"
import { db } from "../db/db"
import { live } from "./live"

export type DigestFilter = "today" | "week"

export interface DigestCard {
  card: Card
  boardId: string
  boardTitle: string
  prefix: string
  columnTitle: string
  columnColor: string
  isDone: boolean
  /** Where ticking the row's checkbox sends the card; null if the board has no done column. */
  doneColumnId: string | null
  /** Where un-ticking sends it: the board's leftmost non-done column. */
  undoneColumnId: string | null
}

type Targets = { doneColumnId: string | null; undoneColumnId: string | null }

/**
 * Each board's tick and un-tick destinations. One sort across all boards is
 * enough: positions only order columns within a board, so interleaving is fine.
 */
function targetsByBoard(columns: Column[]) {
  const targets = new Map<string, Targets>()
  for (const column of [...columns].sort(byPosition)) {
    let board = targets.get(column.dashboardId)
    if (!board) {
      board = { doneColumnId: null, undoneColumnId: null }
      targets.set(column.dashboardId, board)
    }
    if (column.done) board.doneColumnId ??= column.id
    else board.undoneColumnId ??= column.id
  }
  return targets
}

/** Sorts below every real `YYYY-MM-DD`, so it opens an overdue range. */
const MIN_DATE = ""

/** How far ahead the upcoming range looks. */
const RANGE_DAYS = 60

/** Inclusive `[from, to]` deadline bounds of the upcoming range: today through
 * `RANGE_DAYS` out. */
export function upcomingBounds(): [string, string] {
  const today = todayIso()
  return [today, addDays(today, RANGE_DAYS)]
}

/** Inclusive `[from, to]` deadline bounds for a filter, as of today.*/
function bounds(filter: DigestFilter): [string, string] {
  const today = todayIso()
  if (filter === "today") return [today, today]
  return [MIN_DATE, upcomingBounds()[1]]
}

/**
 * Cards across every board whose deadline falls in the filter's range, in date
 * order.
 */
export async function getDigest(filter: DigestFilter): Promise<DigestCard[]> {
  const [from, to] = bounds(filter)
  const [cards, columns, dashboards] = await Promise.all([
    db.getCardsByDeadline(from, to),
    db.getColumns(),
    db.getDashboards(),
  ])

  const liveColumns = columns.filter(live)
  const columnById = new Map(liveColumns.map((c) => [c.id, c]))
  const boardById = new Map(dashboards.filter(live).map((d) => [d.id, d]))
  const targets = targetsByBoard(liveColumns)

  return cards.filter(live).flatMap((card) => {
    // A card whose column or board is tombstoned is gone from the UI's point of
    // view, even though its own record is still live.
    const column = columnById.get(card.columnId)
    const board = column && boardById.get(column.dashboardId)
    if (!column || !board) return []
    return [
      {
        card,
        boardId: board.id,
        boardTitle: board.title,
        prefix: board.prefix,
        columnTitle: column.title,
        columnColor: column.color,
        isDone: column.done,
        doneColumnId: targets.get(board.id)?.doneColumnId ?? null,
        undoneColumnId: targets.get(board.id)?.undoneColumnId ?? null,
      },
    ]
  })
}
