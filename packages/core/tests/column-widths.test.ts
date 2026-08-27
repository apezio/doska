import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Runtime } from "../src/runtime"

const store = new Map<string, string>()

const kv = {
  get: (key: string) => store.get(key) ?? null,
  set: (key: string, value: string) => void store.set(key, value),
  remove: (key: string) => void store.delete(key),
}

const KEY = "doska:column-widths"

/**
 * The module caches storage in a closure, so a test that seeds storage has to
 * load it afresh rather than inherit the previous test's cache.
 */
async function freshModule() {
  vi.resetModules()
  // The reset takes the runtime module with it, so the fresh copy needs one.
  const { installRuntime } = await import("../src/runtime")
  installRuntime({ kv } as unknown as Runtime)
  return await import("../src/data/column-widths")
}

beforeEach(() => {
  store.clear()
})

describe("clampColumnWidth", () => {
  it("keeps a sensible width as it is", async () => {
    const { clampColumnWidth } = await freshModule()
    expect(clampColumnWidth(500)).toBe(500)
  })

  it("refuses to make a column unreadably narrow", async () => {
    const { clampColumnWidth, MIN_COLUMN_WIDTH } = await freshModule()
    expect(clampColumnWidth(10)).toBe(MIN_COLUMN_WIDTH)
    expect(clampColumnWidth(-9999)).toBe(MIN_COLUMN_WIDTH)
  })

  it("refuses to let one column swallow the board", async () => {
    const { clampColumnWidth, MAX_COLUMN_WIDTH } = await freshModule()
    expect(clampColumnWidth(99_999)).toBe(MAX_COLUMN_WIDTH)
  })

  it("gives up the extra width a narrow screen has no room for", async () => {
    const { clampColumnWidth } = await freshModule()
    expect(clampColumnWidth(700, 400)).toBe(400)
  })

  // A phone leaves less room than the minimum. Squeezing to fit would make the
  // column useless, so the minimum wins and the board scrolls instead.
  it("keeps the minimum even when the screen is smaller than it", async () => {
    const { clampColumnWidth, MIN_COLUMN_WIDTH } = await freshModule()
    expect(clampColumnWidth(500, 100)).toBe(MIN_COLUMN_WIDTH)
  })

  it("falls back to the default rather than passing NaN on to a style", async () => {
    const { clampColumnWidth, DEFAULT_COLUMN_WIDTH } = await freshModule()
    expect(clampColumnWidth(Number.NaN)).toBe(DEFAULT_COLUMN_WIDTH)
    expect(clampColumnWidth(Infinity)).toBe(DEFAULT_COLUMN_WIDTH)
  })

  it("rounds to whole pixels", async () => {
    const { clampColumnWidth } = await freshModule()
    expect(clampColumnWidth(400.6)).toBe(401)
  })
})

describe("column widths storage", () => {
  it("writes a width through to storage, clamped", async () => {
    const { setColumnWidth, MAX_COLUMN_WIDTH } = await freshModule()
    setColumnWidth("col-a", 512)
    setColumnWidth("col-b", 5_000)

    expect(JSON.parse(store.get(KEY)!)).toEqual({
      "col-a": 512,
      "col-b": MAX_COLUMN_WIDTH,
    })
  })

  it("keeps each column's width apart from the others", async () => {
    const { setColumnWidth, resetColumnWidth } = await freshModule()
    setColumnWidth("col-a", 300)
    setColumnWidth("col-b", 600)
    resetColumnWidth("col-a")

    expect(JSON.parse(store.get(KEY)!)).toEqual({ "col-b": 600 })
  })

  it("reads back what an earlier session stored", async () => {
    store.set(KEY, JSON.stringify({ "col-a": 512 }))
    const { readColumnWidth, DEFAULT_COLUMN_WIDTH } = await freshModule()

    expect(readColumnWidth("col-a")).toBe(512)
    expect(readColumnWidth("col-unknown")).toBe(DEFAULT_COLUMN_WIDTH)
  })

  it("throws away a stored width that is out of range", async () => {
    store.set(KEY, JSON.stringify({ "col-a": 9_000, "col-b": "wide" }))
    const { readColumnWidth, DEFAULT_COLUMN_WIDTH, MAX_COLUMN_WIDTH } =
      await freshModule()

    expect(readColumnWidth("col-a")).toBe(MAX_COLUMN_WIDTH)
    expect(readColumnWidth("col-b")).toBe(DEFAULT_COLUMN_WIDTH)
  })

  it("survives storage that isn't JSON at all", async () => {
    store.set(KEY, "{not json")
    const { readColumnWidth, DEFAULT_COLUMN_WIDTH } = await freshModule()

    expect(readColumnWidth("col-a")).toBe(DEFAULT_COLUMN_WIDTH)
  })

  it("tells subscribers when a width changes", async () => {
    const { setColumnWidth, subscribeColumnWidths } = await freshModule()
    let heard = 0
    const off = subscribeColumnWidths(() => heard++)

    setColumnWidth("col-a", 400)
    setColumnWidth("col-a", 400) // same width — nothing to say
    setColumnWidth("col-a", 401)
    off()
    setColumnWidth("col-a", 402)

    expect(heard).toBe(2)
  })
})
