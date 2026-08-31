import { describe, expect, it } from "vitest"
import {
  breakGroup,
  canRedo,
  canUndo,
  createHistory,
  current,
  diff,
  record,
  redo,
  undo,
  type Field,
  type History,
  type Snapshot,
} from "./text-history"

const snap = (title: string, body: string): Snapshot => ({ title, body })

function makeClock(start = 0) {
  let t = start
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms
      return t
    },
  }
}

type Clock = ReturnType<typeof makeClock>

/** Simulates typing `text` into `field` one char at a time at caret `at`,
 * like a real user, advancing the clock by `stepMs` between keystrokes. */
function typeText(
  h: History,
  state: Snapshot,
  field: Field,
  text: string,
  at: number,
  clock: Clock,
  stepMs = 100
): Snapshot {
  let pos = at
  for (const ch of text) {
    const prev = state
    const value = state[field].slice(0, pos) + ch + state[field].slice(pos)
    const next: Snapshot = { ...state, [field]: value }
    record(h, prev, next, "typing", clock.advance(stepMs))
    state = next
    pos += 1
  }
  return state
}

/** Simulates pressing backspace `count` times starting with the caret at
 * `at`, removing one char to the left each time. */
function backspaceText(
  h: History,
  state: Snapshot,
  field: Field,
  count: number,
  at: number,
  clock: Clock,
  stepMs = 100
): Snapshot {
  let pos = at
  for (let i = 0; i < count; i++) {
    const prev = state
    const value = state[field].slice(0, pos - 1) + state[field].slice(pos)
    const next: Snapshot = { ...state, [field]: value }
    record(h, prev, next, "typing", clock.advance(stepMs))
    state = next
    pos -= 1
  }
  return state
}

describe("diff", () => {
  it("pure insert", () => {
    expect(diff("hello", "hello world")).toEqual({
      start: 5,
      removed: 0,
      inserted: 6,
    })
  })

  it("pure delete", () => {
    expect(diff("hello world", "hello")).toEqual({
      start: 5,
      removed: 6,
      inserted: 0,
    })
  })

  it("replacement", () => {
    expect(diff("cat", "dog")).toEqual({ start: 0, removed: 3, inserted: 3 })
  })

  it("identical strings", () => {
    const d = diff("same", "same")
    expect(d.removed).toBe(0)
    expect(d.inserted).toBe(0)
    expect(d.start).toBe(4)
  })

  it("insert at start", () => {
    expect(diff("world", "hello world")).toEqual({
      start: 0,
      removed: 0,
      inserted: 6,
    })
  })

  it("insert at end", () => {
    expect(diff("hello", "hello world")).toEqual({
      start: 5,
      removed: 0,
      inserted: 6,
    })
  })

  it("clamps so prefix and suffix don't overlap", () => {
    // Naive unclamped suffix scanning would walk "aa" -> "aaa" as removed: -2.
    expect(diff("aa", "aaa")).toEqual({ start: 2, removed: 0, inserted: 1 })
  })
})

describe("record: typing coalesces into words", () => {
  it("typing 'hello' one char at a time is one undo step", () => {
    const h = createHistory()
    const clock = makeClock()
    typeText(h, snap("", ""), "body", "hello", 0, clock)

    expect(current(h)?.state.body).toBe("hello")
    expect(canUndo(h)).toBe(true)

    const back = undo(h)
    expect(back?.state.body).toBe("")
    expect(canUndo(h)).toBe(false)
  })

  it("typing 'hello world' undoes 'world' then 'hello ' (trailing space absorbed)", () => {
    const h = createHistory()
    const clock = makeClock()
    typeText(h, snap("", ""), "body", "hello world", 0, clock)

    expect(current(h)?.state.body).toBe("hello world")

    const step1 = undo(h)
    expect(step1?.state.body).toBe("hello ")

    const step2 = undo(h)
    expect(step2?.state.body).toBe("")

    expect(canUndo(h)).toBe(false)
  })

  it('"don\'t" stays one step (apostrophe is a word char)', () => {
    const h = createHistory()
    const clock = makeClock()
    typeText(h, snap("", ""), "body", "don't", 0, clock)

    expect(current(h)?.state.body).toBe("don't")
    expect(undo(h)?.state.body).toBe("")
    expect(canUndo(h)).toBe(false)
  })

  it("'foo(bar)' stays one step (punctuation is a word char)", () => {
    const h = createHistory()
    const clock = makeClock()
    typeText(h, snap("", ""), "body", "foo(bar)", 0, clock)

    expect(current(h)?.state.body).toBe("foo(bar)")
    expect(undo(h)?.state.body).toBe("")
    expect(canUndo(h)).toBe(false)
  })

  it("a newline is always its own step, joining neither neighbor", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = snap("", "")
    state = typeText(h, state, "body", "ab", 0, clock)
    state = typeText(h, state, "body", "\n", 2, clock)
    typeText(h, state, "body", "cd", 3, clock)

    expect(current(h)?.state.body).toBe("ab\ncd")
    expect(undo(h)?.state.body).toBe("ab\n")
    expect(undo(h)?.state.body).toBe("ab")
    expect(undo(h)?.state.body).toBe("")
    expect(canUndo(h)).toBe(false)
  })

  it("backspacing 'hello world' undoes the mirror-image groups", () => {
    const h = createHistory()
    const clock = makeClock()
    // First record seeds the base with the full string.
    backspaceText(h, snap("", "hello world"), "body", 11, 11, clock)

    expect(current(h)?.state.body).toBe("")
    const step1 = undo(h)
    const step2 = undo(h)

    expect(canUndo(h)).toBe(false)
    // Backspace runs right-to-left, so the first group ate "world" and then
    // absorbed the space *before* it — the deleted runs are " world" and
    // "hello". Undo is LIFO, so it gives back the word deleted last first.
    expect(step1?.state.body).toBe("hello")
    expect(step2?.state.body).toBe("hello world")
  })

  it("a caret jump breaks the group", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = snap("", "")
    state = typeText(h, state, "body", "abc", 0, clock)
    typeText(h, state, "body", "X", 0, clock)

    expect(current(h)?.state.body).toBe("Xabc")
    expect(undo(h)?.state.body).toBe("abc")
    expect(undo(h)?.state.body).toBe("")
    expect(canUndo(h)).toBe(false)
  })

  it("switching from inserting to deleting breaks the group", () => {
    const h = createHistory()
    const clock = makeClock()
    const state = typeText(h, snap("", ""), "body", "abc", 0, clock)
    backspaceText(h, state, "body", 1, 3, clock)

    expect(current(h)?.state.body).toBe("ab")
    expect(undo(h)?.state.body).toBe("abc")
    expect(undo(h)?.state.body).toBe("")
    expect(canUndo(h)).toBe(false)
  })

  it("a replacement is always its own step", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = typeText(h, snap("", ""), "title", "cat", 0, clock)

    const prev = state
    state = { ...state, title: "dog" }
    record(h, prev, state, "typing", clock.advance(100))

    expect(current(h)?.state.title).toBe("dog")
    expect(undo(h)?.state.title).toBe("cat")
    expect(undo(h)?.state.title).toBe("")
    expect(canUndo(h)).toBe(false)
  })

  it("a command edit never absorbs typing before or after it", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = typeText(h, snap("", ""), "body", "ab", 0, clock)

    const prev = state
    state = { ...state, body: "ab[[link]]" }
    record(h, prev, state, "command", clock.advance(100))

    typeText(h, state, "body", "cd", state.body.length, clock)

    expect(current(h)?.state.body).toBe("ab[[link]]cd")
    expect(undo(h)?.state.body).toBe("ab[[link]]")
    expect(undo(h)?.state.body).toBe("ab")
    expect(undo(h)?.state.body).toBe("")
    expect(canUndo(h)).toBe(false)
  })

  it("elapsed time is a fallback: a >IDLE_MS gap splits an otherwise-adjacent run", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = snap("", "")

    const prev1 = state
    state = { ...state, body: "a" }
    record(h, prev1, state, "typing", clock.advance(100))

    const prev2 = state
    state = { ...state, body: "ab" }
    record(h, prev2, state, "typing", clock.advance(6000))

    expect(current(h)?.state.body).toBe("ab")
    expect(undo(h)?.state.body).toBe("a")
    expect(undo(h)?.state.body).toBe("")
    expect(canUndo(h)).toBe(false)
  })

  it("a gap under IDLE_MS does not split an adjacent run", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = snap("", "")

    const prev1 = state
    state = { ...state, body: "a" }
    record(h, prev1, state, "typing", clock.advance(100))

    const prev2 = state
    state = { ...state, body: "ab" }
    record(h, prev2, state, "typing", clock.advance(4000))

    expect(current(h)?.state.body).toBe("ab")
    expect(undo(h)?.state.body).toBe("")
    expect(canUndo(h)).toBe(false)
  })
})

describe("breakGroup", () => {
  it("forces the next edit to start a fresh step", () => {
    const h = createHistory()
    const clock = makeClock()
    const state = typeText(h, snap("", ""), "body", "ab", 0, clock)

    breakGroup(h)
    typeText(h, state, "body", "c", 2, clock)

    expect(current(h)?.state.body).toBe("abc")
    expect(undo(h)?.state.body).toBe("ab")
    expect(undo(h)?.state.body).toBe("")
  })
})

describe("redo", () => {
  it("undoing then recording truncates the redo branch", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = snap("", "")
    state = typeText(h, state, "body", "a", 0, clock)
    breakGroup(h)
    state = typeText(h, state, "body", "b", 1, clock)
    breakGroup(h)
    typeText(h, state, "body", "c", 2, clock)

    expect(current(h)?.state.body).toBe("abc")
    undo(h)
    undo(h)
    undo(h)
    expect(current(h)?.state.body).toBe("")
    expect(canRedo(h)).toBe(true)

    const prev = current(h)!.state
    const next = { ...prev, body: "z" }
    record(h, prev, next, "typing", clock.advance(100))

    expect(current(h)?.state.body).toBe("z")
    expect(canRedo(h)).toBe(false)
    expect(redo(h)).toBe(null)
  })
})

describe("lazy base", () => {
  it("the first record seeds the stack with the pre-edit state", () => {
    const h = createHistory()
    expect(current(h)).toBe(null)

    const prev = snap("hello", "world")
    const next = snap("hello!", "world")
    record(h, prev, next, "typing", 0)

    expect(h.entries.length).toBe(2)
    expect(canUndo(h)).toBe(true)
    const back = undo(h)
    expect(back?.state).toEqual(prev)
    expect(canUndo(h)).toBe(false)
  })
})

describe("no-op", () => {
  it("leaves the history untouched when nothing changed", () => {
    const h = createHistory()
    const clock = makeClock()
    const state = typeText(h, snap("", ""), "body", "a", 0, clock)

    const before = JSON.stringify(h)
    record(h, state, { ...state }, "typing", clock.advance(100))
    record(h, state, { ...state }, "command", clock.advance(100))

    expect(JSON.stringify(h)).toBe(before)
  })
})

describe("both fields share one stack", () => {
  it("undo walks back across fields in order, preserving the untouched one", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = snap("", "")
    state = typeText(h, state, "title", "abc", 0, clock)
    breakGroup(h)
    typeText(h, state, "body", "xyz", 0, clock)

    expect(current(h)?.state).toEqual(snap("abc", "xyz"))

    const step1 = undo(h)
    expect(step1?.state).toEqual(snap("abc", ""))

    const step2 = undo(h)
    expect(step2?.state).toEqual(snap("", ""))

    expect(canUndo(h)).toBe(false)
  })
})

describe("trimming", () => {
  it("keeps index valid and current() the newest state past MAX_ENTRIES", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = snap("seed", "")

    record(h, snap("", ""), state, "command", clock.advance(100))
    for (let i = 0; i < 600; i++) {
      const prev = state
      state = { ...state, title: `seed-${i}` }
      record(h, prev, state, "command", clock.advance(100))
    }

    expect(h.entries.length).toBeLessThanOrEqual(500)
    expect(h.index).toBeGreaterThanOrEqual(0)
    expect(h.index).toBeLessThan(h.entries.length)
    expect(h.index).toBe(h.entries.length - 1)
    expect(current(h)?.state.title).toBe("seed-599")
  })

  // The budget has to stay honest as entries come and go, or the char cap
  // would eventually trim every push down to a single entry.
  it("the char budget tracks only the entries still retained", () => {
    const h = createHistory()
    const clock = makeClock()
    let state = snap("", "")

    for (let i = 0; i < 600; i++) {
      const prev = state
      state = { ...state, body: `body-${i}` }
      record(h, prev, state, "command", clock.advance(100))
    }
    // Undo a way back, then edit, so a redo branch is discarded too.
    undo(h)
    undo(h)
    const prev = current(h)!.state
    record(
      h,
      prev,
      { ...prev, body: "branched" },
      "command",
      clock.advance(100)
    )

    const retained = h.entries.reduce((sum, e) => sum + e.cost, 0)
    expect(h.chars).toBe(retained)
  })
})

describe("boundaries", () => {
  it("undo at the base returns null", () => {
    const h = createHistory()
    const clock = makeClock()
    typeText(h, snap("", ""), "body", "a", 0, clock)

    undo(h)
    expect(undo(h)).toBe(null)
  })

  it("redo at the tip returns null", () => {
    const h = createHistory()
    const clock = makeClock()
    typeText(h, snap("", ""), "body", "a", 0, clock)

    expect(redo(h)).toBe(null)
  })

  it("undo and redo on a never-recorded history return null", () => {
    const h = createHistory()
    expect(undo(h)).toBe(null)
    expect(redo(h)).toBe(null)
    expect(current(h)).toBe(null)
  })
})
