export interface ColumnColor {
  /** Stored on the column; stable, so renaming a label never re-colors a board. */
  id: string
  label: string
  /** oklch hue, fed to `--column-h` / `--wikilink-h` by whatever renders it. */
  hue: number
}

/**
 * The colors a column can be tinted with. Hues only — each surface picks its
 * own lightness and chroma so a pill, a dot and a header accent stay legible
 * in both themes. A column with no color (`""`) renders neutral.
 */
export const COLUMN_COLORS: ColumnColor[] = [
  { id: "rose", label: "Rose", hue: 10 },
  { id: "orange", label: "Orange", hue: 45 },
  { id: "amber", label: "Amber", hue: 70 },
  { id: "lime", label: "Lime", hue: 110 },
  { id: "green", label: "Green", hue: 145 },
  { id: "teal", label: "Teal", hue: 195 },
  { id: "cyan", label: "Cyan", hue: 215 },
  { id: "blue", label: "Blue", hue: 240 },
  { id: "indigo", label: "Indigo", hue: 265 },
  { id: "violet", label: "Violet", hue: 285 },
  { id: "magenta", label: "Magenta", hue: 320 },
  { id: "pink", label: "Pink", hue: 350 },
]

/** The hue for a stored color id, or null when unset or no longer in the palette. */
export function columnHue(color: string): number | null {
  return COLUMN_COLORS.find((c) => c.id === color)?.hue ?? null
}

export interface ColumnSwatch {
  dot: string
  ring: string
}

/**
 * The swatch dot as sRGB, on a dark ground: `oklch(0.72 0.14 <hue>)` for the
 * fill, as the web states it, and `oklch(0.62 0.15 <hue>)` for the ring. React
 * Native parses neither, so the same colors are resolved here. Regenerate if
 * either lightness or chroma changes above.
 */
const SWATCH: Record<string, ColumnSwatch> = {
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

/**
 * The same dots one step lighter — `oklch(0.80 0.12 <hue>)` — for a light
 * ground, where the darker fill reads as a heavy blot. The ring is unchanged:
 * it is what holds the dot's edge against the paler fill.
 */
const SWATCH_LIGHT: Record<string, ColumnSwatch> = {
  rose: { dot: "#ff9cac", ring: "#cf5971" },
  orange: { dot: "#fea47c", ring: "#cd632d" },
  amber: { dot: "#efb062", ring: "#be7200" },
  lime: { dot: "#c2c564", ring: "#8d8d00" },
  green: { dot: "#8bd28d", ring: "#409d48" },
  teal: { dot: "#44d6d6", ring: "#00a0a2" },
  cyan: { dot: "#4cd1ee", ring: "#009bbe" },
  blue: { dot: "#6fc8ff", ring: "#008fd6" },
  indigo: { dot: "#98bcff", ring: "#5981e0" },
  violet: { dot: "#b6b3ff", ring: "#7f76dc" },
  magenta: { dot: "#e0a4ee", ring: "#ad65be" },
  pink: { dot: "#f89dc9", ring: "#c65b93" },
}

/** The fill and ring for a palette color id, or `null` when it names none. */
export function columnSwatch(
  color: string,
  theme: "light" | "dark"
): ColumnSwatch | null {
  if (columnHue(color) === null) return null
  return (theme === "light" ? SWATCH_LIGHT : SWATCH)[color] ?? null
}
