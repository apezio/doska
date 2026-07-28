/**
 * Deadlines are plain `YYYY-MM-DD` calendar dates. Kept here rather than pulled
 * from the ui-kit, which is a React package the server has no business loading.
 */

/** Local `YYYY-MM-DD` for today. */
export function todayIso(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

/** The `YYYY-MM-DD` `days` away from `iso`. Shifted in UTC so a DST boundary
 * can't land the result on the wrong calendar day. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** How far ahead the app's upcoming view looks. */
export const UPCOMING_DAYS = 60
