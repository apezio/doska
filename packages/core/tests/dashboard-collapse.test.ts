import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Runtime } from "../src/runtime"

const store = new Map<string, string>()

const kv = {
  get: (key: string) => store.get(key) ?? null,
  set: (key: string, value: string) => void store.set(key, value),
  remove: (key: string) => void store.delete(key),
}

const KEY = "doska:collapsed-dashboards"

const stored = () => JSON.parse(store.get(KEY) ?? "null") as unknown

/** The module caches storage in a closure, so each test loads it afresh. */
async function freshModule() {
  vi.resetModules()
  const { installRuntime } = await import("../src/runtime")
  installRuntime({ kv } as unknown as Runtime)
  return await import("../src/data/dashboard-collapse")
}

beforeEach(() => {
  store.clear()
})

describe("dashboard collapse", () => {
  it("toggles a board folded and back", async () => {
    const { toggleDashboardCollapsed } = await freshModule()
    toggleDashboardCollapsed("A")
    expect(stored()).toEqual(["A"])
    toggleDashboardCollapsed("A")
    expect(stored()).toEqual([])
  })

  it("expands only the boards it is given", async () => {
    store.set(KEY, JSON.stringify(["A", "B", "C"]))
    const { expandDashboards } = await freshModule()
    expandDashboards(["A", "C", "X"])
    expect(stored()).toEqual(["B"])
  })

  it("starts from nothing folded when storage is unreadable", async () => {
    store.set(KEY, "{not json")
    const { toggleDashboardCollapsed } = await freshModule()
    toggleDashboardCollapsed("A")
    expect(stored()).toEqual(["A"])
  })

  it("drops entries that are not board ids", async () => {
    store.set(KEY, JSON.stringify(["A", 7, null]))
    const { toggleDashboardCollapsed } = await freshModule()
    toggleDashboardCollapsed("B")
    expect(stored()).toEqual(["A", "B"])
  })
})
