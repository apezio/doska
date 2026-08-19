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
 * The web takes medium's amber from Tailwind classes; native needs the value
 * itself. Its flag and its dot are a shade apart there — `amber-400` and
 * `amber-500`, both mixed to 80% — so each surface carries its own value.
 */
export const PRIORITY = {
  light: { flagMedium: "#ffb900cc", dotMedium: "#fe9a00cc" },
  dark: { flagMedium: "#fbbf24", dotMedium: "#fbbf24" },
} as const

/**
 * Sort key: high 0, medium 1, low 2, unset or retired last. Takes `undefined`
 * because cards stored locally before the field existed read back without it —
 * a client only regains the key when the card is rewritten and pulled back.
 */
export function priorityRank(id: string | undefined): number {
  const index = PRIORITIES.findIndex((p) => p.id === id)
  return index === -1 ? PRIORITIES.length : index
}
