import { COLUMN_COLORS } from "@doska/ui-kit/column-colors"

/**
 * The web states these as `oklch(0.72 0.14 <hue>)` for the fill and
 * `oklch(0.62 0.15 <hue>)` for the ring, which React Native cannot parse.
 * Regenerate from `COLUMN_COLORS` if either lightness or chroma changes there.
 */
const SWATCH: Record<string, { dot: string; ring: string }> = {
  rose: { dot: "#ee7c90", ring: "#cf5971" },
  orange: { dot: "#eb8656", ring: "#cd632d" },
  amber: { dot: "#dc932e", ring: "#be7200" },
  lime: { dot: "#aaac31", ring: "#8d8d00" },
  green: { dot: "#67bb6b", ring: "#409d48" },
  teal: { dot: "#00bfc0", ring: "#00a0a2" },
  cyan: { dot: "#00b9db", ring: "#009bbe" },
  blue: { dot: "#3faff3", ring: "#008fd6" },
  indigo: { dot: "#79a1fc", ring: "#5981e0" },
  violet: { dot: "#9c96f8", ring: "#7f76dc" },
  magenta: { dot: "#cb86db", ring: "#ad65be" },
  pink: { dot: "#e57db1", ring: "#c65b93" },
}

/** The fill and ring for a palette color id, or `null` when it names none. */
export function columnSwatch(
  color: string
): { dot: string; ring: string } | null {
  const current = COLUMN_COLORS.find((c) => c.id === color)
  return (current && SWATCH[current.id]) ?? null
}
