/**
 * A summary as agents are told to write it: a lead sentence, then labelled
 * blocks. Split apart so the view can lead with what is left to do and fold
 * away what is already done.
 */
export interface SummaryBlocks {
  lead: string
  next: string
  waiting: string
  open: string
  done: string
}

type BlockKey = Exclude<keyof SummaryBlocks, "lead">

const LABELS: Record<string, BlockKey> = {
  "next step": "next",
  "next steps": "next",
  "waiting on you": "waiting",
  "still open": "open",
  "done so far": "done",
}

// "Label:", "**Label:**" or "**Label**:", optionally followed by the block's
// only item on the same line.
const HEADER =
  /^\s*(?:\*\*|__)?(next steps?|waiting on you|still open|done so far)(?::(?:\*\*|__)?|(?:\*\*|__):)\s*(.*)$/i

/** Null when the summary carries none of the labels: show it as written. */
export function splitSummary(md: string): SummaryBlocks | null {
  const out: SummaryBlocks = { lead: "", next: "", waiting: "", open: "", done: "" }
  let key: keyof SummaryBlocks = "lead"
  let found = false
  const add = (line: string) => {
    out[key] += (out[key] ? "\n" : "") + line
  }
  for (const line of md.split("\n")) {
    const m = HEADER.exec(line)
    if (!m) {
      add(line)
      continue
    }
    found = true
    key = LABELS[m[1].toLowerCase()]
    if (m[2]) add(m[2])
  }
  if (!found) return null
  for (const k of Object.keys(out) as (keyof SummaryBlocks)[])
    out[k] = out[k].trim()
  return out
}

/** "Nothing.", "- None", "n/a": a block that says there is nothing in it. */
export function isEmptyBlock(md: string): boolean {
  const text = md
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[.!*_]/g, "")
    .trim()
    .toLowerCase()
  return /^(|nothing|none|n\/a)( (yet|now|right now|for now))?$/.test(text)
}

export function countItems(md: string): number {
  return md.match(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm)?.length ?? 0
}
