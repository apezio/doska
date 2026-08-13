/**
 * A `[[target]]` wikilink, as in Obsidian, optionally carrying its own label
 */
export const WIKILINK_RE = /\[\[([^[\]\n|]+)(?:\|([^[\]\n]*))?\]\]/g

/** One link target offered by the `[[` menu. */
export interface WikilinkOption {
  id: string
  title: string
  hint?: string
  /** What lands in the text — the `ROAD-12` in `[[ROAD-12]]`. */
  target: string
}

/**
 * Wraps a target in the wikilink syntax. An `alias` is written alongside it as
 * the label to display
 */
export function toWikilink(target: string, alias?: string): string {
  const label = alias?.trim()
  if (!label || /[[\]|\n]/.test(label)) return `[[${target}]]`
  return `[[${target}|${label}]]`
}

/** Every target a body links to, in document order, without repeats. */
export function wikilinkTargetsIn(body: string): string[] {
  const targets = new Set<string>()
  for (const match of body.matchAll(WIKILINK_RE)) targets.add(match[1].trim())
  return [...targets]
}
