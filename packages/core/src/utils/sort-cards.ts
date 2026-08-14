import { priorityRank } from "@doska/tokens/priority"
import type { Card } from "../types"
import { byPosition } from "./position"

export type SortKey = "priority" | "deadline"

function byDeadline(a: Card, b: Card): number {
  if (a.deadline === b.deadline) return 0
  if (a.deadline === null) return 1
  if (b.deadline === null) return -1
  return a.deadline < b.deadline ? -1 : 1
}

const comparators: Record<SortKey, (a: Card, b: Card) => number> = {
  priority: (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
  deadline: byDeadline,
}

function isSortKey(key: string): key is SortKey {
  return key in comparators
}

export function sortCards(cards: Card[], keys: string[]): Card[] {
  const active = keys.filter(isSortKey)
  if (active.length === 0) return cards
  return [...cards].sort((a, b) => {
    for (const key of active) {
      const order = comparators[key](a, b)
      if (order !== 0) return order
    }
    return byPosition(a, b)
  })
}
