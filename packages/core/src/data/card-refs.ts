import { cardDisplayId } from "@doska/contract/prefix"
import type { Card } from "@doska/contract"
import { useMemo } from "react"
import { useBoard } from "./queries"

const NO_CARDS: Card[] = []

/** A card with no number yet has no display id, so it can't be referenced. */
function referenceable(cards: Card[], prefix: string) {
  return cards.flatMap((card) => {
    const displayId = cardDisplayId(prefix, card.number)
    return displayId ? [{ card, displayId }] : []
  })
}

export interface CardRefOption {
  id: string
  title: string
  hint: string
  target: string
}

/**
 * Cards the `[[` menu can offer, in board order. `excludeCardId` drops the card
 * being edited, since a card referencing itself is never useful.
 */
export function useCardRefOptions(
  deckId: string,
  prefix: string,
  excludeCardId?: string
): CardRefOption[] {
  const { data: board } = useBoard(deckId)
  const cards = board?.cards ?? NO_CARDS

  return useMemo(
    () =>
      referenceable(cards, prefix)
        .filter(({ card }) => card.id !== excludeCardId)
        .map(({ card, displayId }) => ({
          id: card.id,
          title: card.title || "Untitled card",
          hint: displayId,
          target: displayId,
        })),
    [cards, prefix, excludeCardId]
  )
}

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
 * matches nothing — the card was deleted, or the id was typed by hand and
 * never existed.
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
    const match = referenceable(cards, prefix).find(
      (entry) => entry.displayId.toLowerCase() === wanted
    )
    if (!match) return undefined

    const column = columns?.find((one) => one.id === match.card.columnId)
    return {
      card: match.card,
      columnTitle: column?.title ?? "",
      columnColor: column?.color ?? "",
    }
  }, [cards, columns, prefix, displayId])
}
