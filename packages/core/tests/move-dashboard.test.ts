import { beforeEach, describe, expect, it } from "vitest"
import type { Runtime } from "../src/runtime"
import { installRuntime } from "../src/runtime"
import { DASHBOARDS } from "../src/api/constants"
import type { Dashboard } from "../src/types"

/** An in-memory `ClientDB`, keyed `store/key`. */
const rows = new Map<string, unknown>()

const db = {
  get: (store: string, key: string) =>
    Promise.resolve(rows.get(`${store}/${key}`)),
  getAll: (store: string) =>
    Promise.resolve(
      [...rows.entries()]
        .filter(([composite]) => composite.startsWith(`${store}/`))
        .map(([, value]) => value)
    ),
  set: (store: string, key: string, value: unknown) => {
    rows.set(`${store}/${key}`, value)
    return Promise.resolve()
  },
  delete: (store: string, key: string) => {
    rows.delete(`${store}/${key}`)
    return Promise.resolve()
  },
  count: (store: string) =>
    Promise.resolve(
      [...rows.keys()].filter((k) => k.startsWith(`${store}/`)).length
    ),
}

const kvStore = new Map<string, string>()
const kv = {
  get: (key: string) => kvStore.get(key) ?? null,
  set: (key: string, value: string) => void kvStore.set(key, value),
  remove: (key: string) => void kvStore.delete(key),
}
const net = { online: () => true, subscribe: () => () => {} }
// No server configured, so the engines stay paused and nothing reaches the wire.
const http = { isConfigured: () => false, subscribe: () => () => {} }

function board(
  id: string,
  position: string,
  parentId: string | null = null
): Dashboard {
  return {
    id,
    title: id,
    position,
    sort: [],
    parentId,
    updatedAt: 1,
    deletedAt: null,
  }
}

/**
 *   A
 *   └─ A1
 *   B
 *   C
 */
function seed() {
  for (const d of [
    board("A", "a0"),
    board("A1", "a0", "A"),
    board("B", "a1"),
    board("C", "a2"),
  ])
    rows.set(`${DASHBOARDS}/${d.id}`, d)
}

const stored = (id: string) => rows.get(`${DASHBOARDS}/${id}`) as Dashboard

beforeEach(() => {
  rows.clear()
  kvStore.clear()
  installRuntime({ db, kv, net, http } as unknown as Runtime)
  seed()
})

// The engine reads the runtime as it is constructed, so it is imported as
// late as the module under test.
async function load() {
  const { sync } = await import("../src/api/sync/sync-engine")
  const { moveDashboard } = await import("../src/api/operations/move-dashboard")
  const { getDashboards } = await import("../src/api/operations/get-dashboards")
  return { sync, moveDashboard, getDashboards }
}

describe("moveDashboard", () => {
  it("persists the new parent and position, and queues the board for sync", async () => {
    const { sync, moveDashboard } = await load()
    const pending = sync.getState().pending

    await moveDashboard({ id: "B", parentId: "A", position: "a1" })

    expect(stored("B")).toMatchObject({ parentId: "A", position: "a1" })
    expect(stored("B").updatedAt).toBeGreaterThan(1)
    expect(sync.getState().pending).toBe(pending + 1)
  })

  it("reorders a top-level board without touching its parent", async () => {
    const { moveDashboard, getDashboards } = await load()

    await moveDashboard({ id: "C", parentId: null, position: "Zz" })

    expect((await getDashboards()).map((d) => d.id)).toEqual(["C", "A", "A1", "B"])
    expect(stored("C").parentId).toBeNull()
  })

  it("nests a board under another", async () => {
    const { moveDashboard } = await load()
    await moveDashboard({ id: "B", parentId: "A", position: "a1" })
    expect(stored("B").parentId).toBe("A")
  })

  it("unnests a board back to the top level", async () => {
    const { moveDashboard } = await load()
    await moveDashboard({ id: "A1", parentId: null, position: "a3" })
    expect(stored("A1")).toMatchObject({ parentId: null, position: "a3" })
  })

  it("moves a nested board to a different parent", async () => {
    const { moveDashboard } = await load()
    await moveDashboard({ id: "A1", parentId: "C", position: "a0" })
    expect(stored("A1").parentId).toBe("C")
  })

  it("leaves the moved board's own children where they are", async () => {
    const { moveDashboard } = await load()
    await moveDashboard({ id: "A", parentId: "C", position: "a0" })
    expect(stored("A").parentId).toBe("C")
    expect(stored("A1").parentId).toBe("A")
  })

  it("ignores a move under itself or one of its descendants", async () => {
    const { moveDashboard } = await load()
    await moveDashboard({ id: "A", parentId: "A1", position: "a0" })
    await moveDashboard({ id: "A", parentId: "A", position: "a0" })
    expect(stored("A")).toMatchObject({ parentId: null, position: "a0" })
  })

  it("ignores a move under a board that does not exist or is deleted", async () => {
    const { moveDashboard } = await load()
    rows.set(`${DASHBOARDS}/gone`, { ...board("gone", "a9"), deletedAt: 5 })
    await moveDashboard({ id: "B", parentId: "gone", position: "a0" })
    await moveDashboard({ id: "B", parentId: "nope", position: "a0" })
    expect(stored("B")).toMatchObject({ parentId: null, position: "a1" })
  })

  it("writes nothing when the board is already there", async () => {
    const { sync, moveDashboard } = await load()
    const pending = sync.getState().pending
    await moveDashboard({ id: "A1", parentId: "A", position: "a0" })
    expect(stored("A1").updatedAt).toBe(1)
    expect(sync.getState().pending).toBe(pending)
  })
})

describe("getDashboards", () => {
  it("reads a board stored before nesting existed as top-level", async () => {
    const { getDashboards } = await load()
    const legacy = { ...board("L", "a5"), parentId: undefined }
    rows.set(`${DASHBOARDS}/L`, legacy)
    const found = (await getDashboards()).find((d) => d.id === "L")
    expect(found?.parentId).toBeNull()
  })
})
