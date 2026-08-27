/**
 * How a card's numeric priority (0–100, `0` for none — see `@doska/contract`'s
 * `priority` module) is coloured. The number itself is what a card shows; the
 * band is for the places that only have room for a colour, such as the
 * sidebar's dot.
 */

export type PriorityBand = "high" | "medium" | "low"

/** Lowest value that still reads as each band, most important first. */
export const PRIORITY_BANDS: { id: PriorityBand; label: string; from: number }[] =
  [
    { id: "high", label: "High", from: 67 },
    { id: "medium", label: "Medium", from: 34 },
    { id: "low", label: "Low", from: 1 },
  ]

/** The band a value falls in, or `null` for no priority. */
export function priorityBand(value: number): PriorityBand | null {
  return PRIORITY_BANDS.find((band) => value >= band.from)?.id ?? null
}

/** The web takes medium's amber from Tailwind classes; native needs the value
 * itself. Same pair as `DEADLINE.soonForeground`, which sits beside it on a card. */
export const PRIORITY = {
  light: { medium: "#d97706" },
  dark: { medium: "#fbbf24" },
} as const
