import { parse, Scalar, stringify } from "yaml"

/** Null for frontmatter that isn't a mapping, however badly it's broken. */
export function readFrontmatter(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = parse(text)
    if (parsed === null || parsed === undefined) return {}
    if (typeof parsed !== "object" || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

/** The block between the fences, newline-terminated. */
export function writeFrontmatter(fields: Record<string, unknown>): string {
  return stringify(fields, { lineWidth: 0 })
}

/** A scalar as text, and null when it's absent or empty. */
export function readText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = typeof value === "string" ? value.trim() : String(value)
  return text || null
}

/** A value as a list of strings, however the user wrote it. */
export function readList(value: unknown): string[] {
  const items = Array.isArray(value) ? value : [value]
  const texts: string[] = []
  for (const item of items) {
    const text = readText(item)
    if (text !== null) texts.push(text)
  }
  return texts
}

/** Forces quotes on one value: the title is the field with free text in it. */
export function quoted(text: string): Scalar {
  const scalar = new Scalar(text)
  scalar.type = Scalar.QUOTE_DOUBLE
  return scalar
}
