/** Local `YYYY-MM-DD` for today. Deliberately a copy of `@doska/ui-kit`'s —
 * this package has no business depending on the UI kit, and `packages/mcp`
 * already keeps its own for the same reason. */
export function todayIso(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

/** The `YYYY-MM-DD` `days` away from `iso`. Parsed as UTC and shifted in UTC, so
 * a DST boundary can't land the result on the wrong calendar day. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** The day a date falls on, spelled out — the label people actually scan for.
 * Parsed as UTC to match `addDays`, so the weekday can't drift by a day. */
export function weekday(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    timeZone: "UTC",
  })
}

/** A date as `21 August`, ordered by locale — the year tacked on only when it
 * isn't the current one. Parsed as UTC to match `weekday`. */
export function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const sameYear = d.getUTCFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  })
}
