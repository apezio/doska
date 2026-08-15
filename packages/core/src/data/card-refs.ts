import { cardDisplayId } from "@doska/contract/prefix"
import type { Card } from "@doska/contract"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import * as api from "../api/operations"
import { live } from "../api/operations/live"
import { keys } from "./keys"

export interface CardRefOption {
  id: string
  title: string
  hint: string
  target: string
}

const NO_OPTIONS: CardRefOption[] = []

/** A card with no number yet has no display id, so it can't be referenced. */
async function referenceable(
  deckId: string,
  prefix: string
): Promise<CardRefOption[]> {
  const { cards } = await api.getBoard(deckId)
  return cards.flatMap((card) => {
    const displayId = cardDisplayId(prefix, card.number)
    if (!displayId) return []
    return [
      {
        id: card.id,
        title: card.title || "Untitled card",
        hint: displayId,
        target: displayId,
      },
    ]
  })
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
  const { data: options } = useQuery({
    queryKey: keys.cardRefOptions(deckId, prefix),
    queryFn: () => referenceable(deckId, prefix),
    networkMode: "always",
  })

  return useMemo(() => {
    if (!options) return NO_OPTIONS
    if (!excludeCardId) return options
    return options.filter((option) => option.id !== excludeCardId)
  }, [options, excludeCardId])
}

export interface ResolvedCardRef {
  card: Card
  /** The column the card sits in — its status, in most people's boards. */
  columnTitle: string
  /** The column's palette color id; empty when it has none. */
  columnColor: string
  /** The card sits in the board's done column. */
  columnDone: boolean
}

/** The `12` in `ROAD-12`, or null when the text isn't this board's display id.
 * Ids are matched case-insensitively — people type them by hand. */
function refNumber(prefix: string, displayId: string): number | null {
  if (!prefix) return null
  const typed = displayId.trim().toUpperCase()
  const head = `${prefix.toUpperCase()}-`
  if (!typed.startsWith(head)) return null
  const rest = typed.slice(head.length)
  return /^\d+$/.test(rest) ? Number(rest) : null
}

/**
 * Resolves one `[[ROAD-12]]` without reading the board: an index seek on the
 * card number, then one column read per candidate — which both places the card
 * on this board and supplies the pill.
 *
 * Deletes are tombstones, so the number index still returns a deleted card;
 * skipping it is what turns the link into the "no such card" state.
 */
async function resolveCardRef(
  deckId: string,
  prefix: string,
  displayId: string
): Promise<ResolvedCardRef | null> {
  const number = refNumber(prefix, displayId)
  if (number == null) return null

  const candidates = (await api.getCardsByNumber(number)).filter(live)
  const placed = await Promise.all(
    candidates.map(async (card) => ({
      card,
      column: await api.getCardCol(card.id),
    }))
  )

  const match = placed.find(
    ({ column }) => column && live(column) && column.dashboardId === deckId
  )
  if (!match?.column) return null

  return {
    card: match.card,
    columnTitle: match.column.title,
    columnColor: match.column.color ?? "",
    columnDone: match.column.done ?? false,
  }
}

/** The card a `[[ROAD-12]]` points at, or undefined until it resolves. */
export function useCardRef(
  deckId: string,
  prefix: string,
  displayId: string
): ResolvedCardRef | undefined {
  const { data } = useQuery({
    queryKey: keys.cardRef(deckId, prefix, displayId),
    queryFn: () => resolveCardRef(deckId, prefix, displayId),
    networkMode: "always",
  })
  return data ?? undefined
}
