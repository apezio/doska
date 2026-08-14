export interface Priority {
  /** Stored on the card; `""` means none. */
  id: string
  label: string
}

/** The importance levels a card can carry, most important first. */
export const PRIORITIES: Priority[] = [
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
]

/**
 * Sort key: high 0, medium 1, low 2, unset or retired last. Takes `undefined`
 * because cards stored locally before the field existed read back without it —
 * a client only regains the key when the card is rewritten and pulled back.
 */
export function priorityRank(id: string | undefined): number {
  const index = PRIORITIES.findIndex((p) => p.id === id)
  return index === -1 ? PRIORITIES.length : index
}
