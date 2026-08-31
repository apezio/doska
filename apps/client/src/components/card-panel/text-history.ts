// Undo/redo history for one card's editing session. A card has two text
// fields, title and body, and they share one stack: entries are full
// snapshots of both, but a snapshot shares the untouched field's string by
// reference, so an entry only ever costs one string copy.

export type Field = "title" | "body"
export type EditSource = "typing" | "command"

/** Both fields of a card, as they stood at one point in the session. */
export interface Snapshot {
  title: string
  body: string
}

/** Where the caret sat while a snapshot was current. */
export interface Sel {
  field: Field
  start: number
  end: number
}

export interface Entry {
  state: Snapshot
  /** Settled selection for this state, or null when no field had focus. */
  sel: Sel | null
  /** Chars this entry changed. Internal bookkeeping for the trim budget. */
  cost: number
}

/** A contiguous run of typing that undo takes back in one step. */
interface Group {
  field: Field
  kind: "insert" | "delete"
  /** Where the next change must touch to continue this group. */
  caret: number
  cls: "word" | "space"
  at: number
  size: number
}

export interface History {
  entries: Entry[]
  /** `entries[index]` is current; everything after it is the redo branch. */
  index: number
  group: Group | null
  /** Sum of `cost` over the retained entries, for the trim budget. A proxy
   * for memory, not a true byte count: snapshots share unchanged strings. */
  chars: number
}

export interface Change {
  start: number
  removed: number
  inserted: number
}

// Grouping boundaries are primary; these are fallback safety nets only, so
// they're generous. Pausing mid-word to think must not split the word, and
// real sessions never come close to the size caps below.
const IDLE_MS = 5000
const MAX_GROUP = 1000
const MAX_ENTRIES = 500
const MAX_CHARS = 2_000_000

/**
 * Common-prefix / common-suffix scan between two strings. `start` is the
 * length of the shared prefix; `removed`/`inserted` are what's left of `a`
 * and `b` once the shared prefix and suffix are stripped.
 */
export function diff(a: string, b: string): Change {
  const max = Math.min(a.length, b.length)
  let start = 0
  while (start < max && a[start] === b[start]) start++

  // Clamp so the suffix scan can't walk back over the prefix it just found —
  // otherwise "aa" -> "aaa" would double-count the shared "a"s.
  const maxSuffix = max - start
  let end = 0
  while (end < maxSuffix && a[a.length - 1 - end] === b[b.length - 1 - end]) {
    end++
  }

  return {
    start,
    removed: a.length - start - end,
    inserted: b.length - start - end,
  }
}

/**
 * Classifies a run of changed text so an insert/delete knows what group it
 * may join. Punctuation counts as a word char — `don't` and `foo(bar)` are
 * one run by design — and any newline forces its own step.
 */
function runClass(text: string): "word" | "space" | null {
  if (/[\n\r]/.test(text)) return null
  let sawWord = false
  let sawSpace = false
  for (const ch of text) {
    if (ch === " " || ch === "\t") sawSpace = true
    else sawWord = true
  }
  if (sawWord && sawSpace) return null
  if (sawWord) return "word"
  if (sawSpace) return "space"
  return null
}

function fieldChangeLen(a: string, b: string): number {
  const d = diff(a, b)
  return d.removed + d.inserted
}

export function createHistory(): History {
  return { entries: [], index: -1, group: null, chars: 0 }
}

/** Pushes a new entry onto the current branch, dropping any redo branch. */
function pushEntry(
  h: History,
  next: Snapshot,
  changedLength: number,
  group: Group | null
): void {
  // Dropping the redo branch hands its budget back.
  for (let i = h.index + 1; i < h.entries.length; i++)
    h.chars -= h.entries[i].cost
  h.entries.length = h.index + 1
  h.entries.push({ state: next, sel: null, cost: changedLength })
  h.index++
  h.group = group
  h.chars += changedLength

  // Both caps slide a window over the session rather than cutting it off: an
  // entry hands its budget back as it leaves. The length floor is only for the
  // degenerate case of a single change bigger than the whole budget.
  while (
    (h.entries.length > MAX_ENTRIES || h.chars > MAX_CHARS) &&
    h.entries.length > 1
  ) {
    const dropped = h.entries.shift()
    if (dropped) h.chars -= dropped.cost
    h.index = Math.max(0, h.index - 1)
  }
}

/**
 * Records prev -> next as a step, coalescing a run of typing into the
 * current entry when it continues the same word/space run at the same
 * caret. `now` is passed in so callers (and tests) control time.
 */
export function record(
  h: History,
  prev: Snapshot,
  next: Snapshot,
  source: EditSource,
  now: number
): void {
  // Lazy base: the stack starts empty, so the first record seeds it with the
  // exact pre-edit state rather than something captured at mount.
  if (h.entries.length === 0) {
    h.entries.push({ state: prev, sel: null, cost: 0 })
    h.index = 0
  }

  if (next.title === prev.title && next.body === prev.body) return

  const titleChanged = next.title !== prev.title
  const bodyChanged = next.body !== prev.body

  // A command edit, or a change that touched both fields at once, never
  // coalesces.
  if (source === "command" || (titleChanged && bodyChanged)) {
    const len =
      (titleChanged ? fieldChangeLen(prev.title, next.title) : 0) +
      (bodyChanged ? fieldChangeLen(prev.body, next.body) : 0)
    pushEntry(h, next, len, null)
    return
  }

  const field: Field = titleChanged ? "title" : "body"
  const ch = diff(prev[field], next[field])

  const kind: "insert" | "delete" | "replace" =
    ch.inserted > 0 && ch.removed === 0
      ? "insert"
      : ch.removed > 0 && ch.inserted === 0
        ? "delete"
        : "replace"

  // A replacement (a selection overtyped) can never coalesce.
  if (kind === "replace") {
    pushEntry(h, next, ch.removed + ch.inserted, null)
    return
  }

  const changedText =
    kind === "insert"
      ? next[field].slice(ch.start, ch.start + ch.inserted)
      : prev[field].slice(ch.start, ch.start + ch.removed)
  const cls = runClass(changedText)
  const changedLength = changedText.length
  const caret = kind === "insert" ? ch.start + ch.inserted : ch.start

  const g = h.group
  if (
    g !== null &&
    cls !== null &&
    g.field === field &&
    g.kind === kind &&
    // Adjacency: an insert must land where the group left off; a delete may
    // be a backspace eating leftward from the caret or a forward delete
    // eating rightward.
    (kind === "insert"
      ? ch.start === g.caret
      : ch.start + ch.removed === g.caret || ch.start === g.caret) &&
    // Whitespace is absorbed into the word run it follows; space -> word
    // always breaks, which is what makes undo take back whole words.
    (cls === g.cls || (g.cls === "word" && cls === "space")) &&
    now - g.at <= IDLE_MS &&
    g.size + changedLength <= MAX_GROUP
  ) {
    h.entries[h.index].state = next
    h.entries[h.index].cost += changedLength
    h.chars += changedLength
    g.cls = cls
    g.caret = caret
    g.at = now
    g.size += changedLength
    return
  }

  // Nothing can join a step that was never a plain typed run.
  pushEntry(
    h,
    next,
    changedLength,
    cls === null
      ? null
      : { field, kind, caret, cls, at: now, size: changedLength }
  )
}

export function undo(h: History): Entry | null {
  if (h.index <= 0) return null
  h.group = null
  h.index--
  return h.entries[h.index]
}

export function redo(h: History): Entry | null {
  if (h.index >= h.entries.length - 1) return null
  h.group = null
  h.index++
  return h.entries[h.index]
}

export function breakGroup(h: History): void {
  h.group = null
}

export function canUndo(h: History): boolean {
  return h.index > 0
}

export function canRedo(h: History): boolean {
  return h.index < h.entries.length - 1
}

export function current(h: History): Entry | null {
  return h.entries[h.index] ?? null
}
