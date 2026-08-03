import type { Card } from "@doska/contract"
import { cardDisplayId } from "@doska/contract/prefix"
import { useBoard } from "@doska/core/queries"
import { useMemo } from "react"

const NO_CARDS: Card[] = []

export interface ResolvedCardRef {
  card: Card
  /** The column the card sits in — its status, in most people's boards. */
  columnTitle: string
  /** The column's palette color id; empty when it has none. */
  columnColor: string
}

/**
 * Resolves the display id in a `[[ROAD-12]]` reference back to a card on the
 * same board, with the column it currently sits in. Undefined when the id
 * matches nothing — the card was deleted, or the id was typed by hand and never
 * existed. A card with no number yet has no display id, so it can't be one.
 */
export function useCardRef(
  deckId: string,
  prefix: string,
  displayId: string
): ResolvedCardRef | undefined {
  const { data: board } = useBoard(deckId)
  const cards = board?.cards ?? NO_CARDS
  const columns = board?.columns

  return useMemo(() => {
    const wanted = displayId.trim().toLowerCase()
    const match = cards.find(
      (card) => cardDisplayId(prefix, card.number)?.toLowerCase() === wanted
    )
    if (!match) return undefined

    const column = columns?.find((one) => one.id === match.columnId)
    return {
      card: match,
      columnTitle: column?.title ?? "",
      columnColor: column?.color ?? "",
    }
  }, [cards, columns, prefix, displayId])
}
