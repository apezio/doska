import { useEffect, useState } from "react"
import type { DropResult } from "@hello-pangea/dnd"
import type { Card } from "@doska/core/types"

/** Matches the drop transition `draggable-card` sets. */
export const DROP_ANIMATION_MS = 150
const HOLD_FALLBACK_MS = 400

interface Landing {
  cardId: string
  columnId: string
  index: number
}

/**
 * Holds a dropped card at the slot it was dropped in for as long as the drop
 * animation runs.
 */
export function useLandingSlot(enabled: boolean) {
  const [landing, setLanding] = useState<Landing | null>(null)

  useEffect(() => {
    if (!landing) return
    const timer = setTimeout(() => setLanding(null), HOLD_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [landing])

  function hold({ destination, draggableId }: DropResult) {
    if (!enabled || !destination) return
    setLanding({
      cardId: draggableId,
      columnId: destination.droppableId,
      index: destination.index,
    })
  }

  function release(cardId: string) {
    setLanding((current) => (current?.cardId === cardId ? null : current))
  }

  function place(cards: Card[], columnId: string): Card[] {
    if (!landing || landing.columnId !== columnId) return cards
    const from = cards.findIndex((card) => card.id === landing.cardId)
    if (from === -1) return cards
    const next = [...cards]
    const [moved] = next.splice(from, 1)
    next.splice(landing.index, 0, moved)
    return next
  }

  return { hold, release, place }
}
