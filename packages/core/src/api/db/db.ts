import { toPriority } from "@doska/contract"
import { runtime } from "../../runtime"
import { cards as seedCards, seedColumns, seedDashboards } from "../../seed"
import type { Card, Column, Dashboard } from "../../types"
import {
  CARDS,
  CARDS_BY_COLUMN,
  CARDS_BY_DEADLINE,
  CARDS_BY_NUMBER,
  COLUMNS,
  DASHBOARDS,
  type StoreName,
} from "../constants"
import { stamp } from "../sync/hlc"

/**
 * Populates the stores from the fixtures on an empty DB. Called once at page
 * load; a non-empty store is left untouched so an existing user keeps their data.
 */
export async function seed(): Promise<void> {
  if ((await runtime().db.count(DASHBOARDS)) > 0) return
  await Promise.all([
    ...seedDashboards.map((d) => runtime().db.set(DASHBOARDS, d.id, d)),
    ...seedColumns.map((c) => runtime().db.set(COLUMNS, c.id, c)),
    ...seedCards.map((c) => runtime().db.set(CARDS, c.id, c)),
  ])
}

/**
 * Tombstones a record instead of removing it: sets `deletedAt` and bumps
 * `updatedAt` (the last-writer-wins version). We never hard-delete, because a
 * removed row can't push its own deletion and would be re-created on the next
 * pull — see sync.ts. `live()` is what hides tombstones from the UI. The
 * tombstone stays put until it ages out of the trash (see `purgeExpired`).
 */
function tombstone<T extends { deletedAt: number | null; updatedAt: number }>(
  record: T
): T {
  const now = stamp()
  return { ...record, deletedAt: now, updatedAt: now }
}

/** Clears a tombstone and bumps `updatedAt`, so the revival wins LWW. */
function revive<T extends { deletedAt: number | null; updatedAt: number }>(
  record: T
): T {
  return { ...record, deletedAt: null, updatedAt: stamp() }
}

/**
 * Brings a stored card up to the current shape. Only `priority` needs it: cards
 * written before it became a number hold the old `high`/`medium`/`low`/`""`
 * enum. Migrating on read keeps the store untouched until the card is next
 * written — at which point the normalised value is what gets saved.
 */
function migrateCard(card: Card): Card {
  const priority = toPriority(card.priority)
  return priority === card.priority ? card : { ...card, priority }
}

function migrateCards(cards: Card[]): Card[] {
  return cards.map(migrateCard)
}

export const db = {
  async getCard(id: string): Promise<Card | undefined> {
    const card = await runtime().db.get<Card>(CARDS, id)
    return card && migrateCard(card)
  },
  async getCards(columnId?: string): Promise<Card[]> {
    return migrateCards(
      await runtime().db.getAll<Card>(
        CARDS,
        columnId
          ? {
              index: CARDS_BY_COLUMN,
              range: { lower: columnId, upper: columnId },
            }
          : undefined
      )
    )
  },
  async getCardsByNumber(num?: number): Promise<Card[]> {
    return migrateCards(
      await runtime().db.getAll<Card>(
        CARDS,
        num
          ? {
              index: CARDS_BY_NUMBER,
              range: { lower: num, upper: num },
            }
          : undefined
      )
    )
  },
  /** Cards deadlined within `[from, to]` (inclusive `YYYY-MM-DD` bounds), in
   * date order. Spans every board — the index is global. */
  async getCardsByDeadline(from: string, to: string): Promise<Card[]> {
    return migrateCards(
      await runtime().db.getAll<Card>(CARDS, {
        index: CARDS_BY_DEADLINE,
        range: { lower: from, upper: to },
      })
    )
  },
  setCard(card: Card): Promise<void> {
    return runtime().db.set(CARDS, card.id, card)
  },
  softDeleteCard(card: Card): Promise<void> {
    return runtime().db.set(CARDS, card.id, tombstone(card))
  },
  restoreCard(card: Card): Promise<void> {
    return runtime().db.set(CARDS, card.id, revive(card))
  },
  getColumn(id: string): Promise<Column | undefined> {
    return runtime().db.get<Column>(COLUMNS, id)
  },
  getColumns(): Promise<Column[]> {
    return runtime().db.getAll<Column>(COLUMNS)
  },
  setColumn(column: Column): Promise<void> {
    return runtime().db.set(COLUMNS, column.id, column)
  },
  softDeleteColumn(column: Column): Promise<void> {
    return runtime().db.set(COLUMNS, column.id, tombstone(column))
  },
  restoreColumn(column: Column): Promise<void> {
    return runtime().db.set(COLUMNS, column.id, revive(column))
  },
  getDashboard(id: string): Promise<Dashboard | undefined> {
    return runtime().db.get<Dashboard>(DASHBOARDS, id)
  },
  getDashboards(): Promise<Dashboard[]> {
    return runtime().db.getAll<Dashboard>(DASHBOARDS)
  },
  setDashboard(dashboard: Dashboard): Promise<void> {
    return runtime().db.set(DASHBOARDS, dashboard.id, dashboard)
  },
  softDeleteDashboard(dashboard: Dashboard): Promise<void> {
    return runtime().db.set(DASHBOARDS, dashboard.id, tombstone(dashboard))
  },
  restoreDashboard(dashboard: Dashboard): Promise<void> {
    return runtime().db.set(DASHBOARDS, dashboard.id, revive(dashboard))
  },
  /** Removes a record outright. Only for tombstones past retention. */
  hardDelete(store: StoreName, id: string): Promise<void> {
    return runtime().db.delete(store, id)
  },
}
