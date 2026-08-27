/**
 * Card priority: an integer 0–100, higher is more important, `0` for none.
 *
 * It replaced a `high` / `medium` / `low` / `""` enum. Records written by that
 * scheme still arrive here — from a client's local store, from an older client
 * pushing over sync — so every boundary that reads a priority runs it through
 * `toPriority`, and the mapping below is what "migrating" a card means.
 */

export const PRIORITY_MIN = 0
export const PRIORITY_MAX = 100

/** No priority. Sorts last, and the card shows a dash instead of a number. */
export const PRIORITY_NONE = 0

/** What each level of the retired enum becomes. */
export const LEGACY_PRIORITY: Record<string, number> = {
  high: 75,
  medium: 50,
  low: 25,
}

export function clampPriority(value: number): number {
  return Math.min(PRIORITY_MAX, Math.max(PRIORITY_MIN, Math.round(value)))
}

/**
 * Anything a card's `priority` field has ever held, read as a number:
 * a number is clamped and rounded, a retired level is mapped, a numeric string
 * is parsed, and everything else — `""`, `null`, a field that predates the
 * column — is `PRIORITY_NONE`.
 */
export function toPriority(raw: unknown): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? clampPriority(raw) : PRIORITY_NONE
  }
  if (typeof raw !== "string") return PRIORITY_NONE
  const legacy = LEGACY_PRIORITY[raw.trim().toLowerCase()]
  if (legacy !== undefined) return legacy
  const parsed = Number(raw.trim())
  if (raw.trim() === "" || !Number.isFinite(parsed)) return PRIORITY_NONE
  return clampPriority(parsed)
}

/**
 * Sort key: most important first, unset last. Lower wins, so callers can keep
 * subtracting one rank from another.
 */
export function priorityRank(value: unknown): number {
  const priority = toPriority(value)
  return priority > PRIORITY_NONE ? PRIORITY_MAX - priority : PRIORITY_MAX + 1
}
