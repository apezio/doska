import { db } from "../db/db"
import { getCardCol } from "./get-card-col"

/** The board a card belongs to. */
export interface CardDeck {
  id: string
}

/**
 * Walks a card back to its board through its column. The digest opens cards
 * from boards other than the one the app is pointed at, so the card panel has
 * to resolve its own deck rather than inherit the route's.
 */
export async function getCardDeck(cardId: string): Promise<CardDeck | null> {
  const column = await getCardCol(cardId)
  if (!column) return null
  const dashboard = await db.getDashboard(column.dashboardId)
  return dashboard || null
}
