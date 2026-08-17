// `- foo`, `* foo`, `+ foo`, optionally with a `[ ]`/`[x]` task checkbox.
const UNORDERED = /^(\s*)([-*+])[ \t]+(\[[ xX]\][ \t]+)?(.*)$/
// `1. foo` or `1) foo`.
const ORDERED = /^(\s*)(\d+)([.)])[ \t]+(.*)$/

interface ListItem {
  /** Prefix to prepend to the next row (indent + marker + space). */
  continuation: string
  /** True when the item has no text after its marker. */
  empty: boolean
}

function parseListItem(line: string): ListItem | null {
  const unordered = UNORDERED.exec(line)
  if (unordered) {
    const [, indent, bullet, checkbox, content] = unordered
    // A continued task item starts unchecked, matching editor conventions.
    const marker = checkbox ? `${bullet} [ ] ` : `${bullet} `
    return { continuation: indent + marker, empty: content.trim() === "" }
  }

  const ordered = ORDERED.exec(line)
  if (ordered) {
    const [, indent, num, delim, content] = ordered
    const next = Number(num) + 1
    return {
      continuation: `${indent}${next}${delim} `,
      empty: content.trim() === "",
    }
  }

  return null
}

export interface ListContinuation {
  value: string
  caret: number
}

/**
 * The result of a newline at `caret` inside a Markdown list item: a new row
 * carrying the same marker (bullet, or the next number for ordered lists).
 * A newline on an empty item strips the marker instead, so you can exit the
 * list. Returns null on a non-list line, where a plain newline is what's wanted.
 */
export function continueList(
  value: string,
  caret: number
): ListContinuation | null {
  const lineStart = value.lastIndexOf("\n", caret - 1) + 1
  const lineEnd = value.indexOf("\n", caret)
  const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd)

  // A newline at the very start of an existing list item should just push the
  // item down, not continue the list.
  if (caret === lineStart) return null

  const item = parseListItem(line)
  if (!item) return null

  if (item.empty) {
    // Drop the marker, leaving a blank line to type prose on.
    return {
      value: value.slice(0, lineStart) + value.slice(caret),
      caret: lineStart,
    }
  }

  const insert = "\n" + item.continuation
  return {
    value: value.slice(0, caret) + insert + value.slice(caret),
    caret: caret + insert.length,
  }
}
