import type { Card, Column, Dashboard } from "../../types"
import { byPosition, byPriorityThenNumber } from "../../utils"
import { db } from "../db/db"
import { live } from "./live"

/** Which of a board's first two columns a card sits in. */
export type OpenCardStage = "todo" | "doing"

export interface OpenCard {
  card: Card
  boardId: string
  boardTitle: string
  columnTitle: string
  /** The column's palette color id; empty when it has none. */
  columnColor: string
  stage: OpenCardStage
}

export interface OpenCards {
  todo: OpenCard[]
  doing: OpenCard[]
  /** How many open cards there are in all, before the cap. */
  total: number
}

/** How many cards the sidebar lists before saying "and N more". */
export const OPEN_CARDS_LIMIT = 10

/**
 * A board's columns read as stages by position: the first is To Do, the second
 * In Progress, the third Done. Cards in any other column are not "open".
 */
const STAGE_BY_INDEX: OpenCardStage[] = ["todo", "doing"]

/**
 * The To Do and In Progress cards across every board, each pile in priority
 * order, capped to `limit` in all — To Do fills first. Cards whose column or
 * board is tombstoned are left out, as in the digest.
 */
export function groupOpenCards(
  cards: Card[],
  columns: Column[],
  dashboards: Dashboard[],
  limit = OPEN_CARDS_LIMIT
): OpenCards {
  const boardById = new Map(dashboards.filter(live).map((d) => [d.id, d]))

  const stageByColumn = new Map<string, OpenCardStage>()
  const byBoard = new Map<string, Column[]>()
  for (const column of columns.filter(live)) {
    if (!boardById.has(column.dashboardId)) continue
    const list = byBoard.get(column.dashboardId) ?? []
    list.push(column)
    byBoard.set(column.dashboardId, list)
  }
  for (const list of byBoard.values()) {
    list.sort(byPosition).forEach((column, index) => {
      const stage = STAGE_BY_INDEX[index]
      if (stage) stageByColumn.set(column.id, stage)
    })
  }
  const columnById = new Map(columns.map((c) => [c.id, c]))

  const todo: OpenCard[] = []
  const doing: OpenCard[] = []
  for (const card of cards.filter(live)) {
    const stage = stageByColumn.get(card.columnId)
    if (!stage) continue
    const column = columnById.get(card.columnId)!
    const board = boardById.get(column.dashboardId)!
    const entry = {
      card,
      boardId: board.id,
      boardTitle: board.title,
      columnTitle: column.title,
      columnColor: column.color ?? "",
      stage,
    }
    if (stage === "todo") todo.push(entry)
    else doing.push(entry)
  }

  const byCard = (a: OpenCard, b: OpenCard) =>
    byPriorityThenNumber(a.card, b.card)
  todo.sort(byCard)
  doing.sort(byCard)

  const total = todo.length + doing.length
  const shownTodo = todo.slice(0, limit)
  return {
    todo: shownTodo,
    doing: doing.slice(0, Math.max(0, limit - shownTodo.length)),
    total,
  }
}

export async function getOpenCards(
  limit = OPEN_CARDS_LIMIT
): Promise<OpenCards> {
  const [cards, columns, dashboards] = await Promise.all([
    db.getCards(),
    db.getColumns(),
    db.getDashboards(),
  ])
  return groupOpenCards(cards, columns, dashboards, limit)
}
