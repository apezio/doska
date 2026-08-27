import { beforeEach, describe, expect, it } from "vitest"
import type { KeyRange } from "@doska/ports"
import type { Runtime } from "../src/runtime"
import { installRuntime } from "../src/runtime"
import { CARDS, COLUMNS, DASHBOARDS } from "../src/api/constants"

/** An in-memory `ClientDB`, keyed `store/key`, honouring the cards-by-column index. */
const rows = new Map<string, unknown>()

const inStore = (store: string) =>
  [...rows.entries()]
    .filter(([composite]) => composite.startsWith(`${store}/`))
    .map(([, value]) => value)

const db = {
  get: (store: string, key: string) =>
    Promise.resolve(rows.get(`${store}/${key}`)),
  getAll: (store: string, query?: { index: string; range: KeyRange }) =>
    Promise.resolve(
      inStore(store).filter(
        (row) =>
          !query ||
          (row as Record<string, unknown>)[query.index] === query.range.lower
      )
    ),
  set: (store: string, key: string, value: unknown) => {
    rows.set(`${store}/${key}`, value)
    return Promise.resolve()
  },
  delete: (store: string, key: string) => {
    rows.delete(`${store}/${key}`)
    return Promise.resolve()
  },
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

const board = (id: string) => ({ id, updatedAt: 1, deletedAt: null })
const column = (id: string, dashboardId: string, position: string) => ({
  id,
  dashboardId,
  position,
  updatedAt: 1,
  deletedAt: null,
})
const card = (id: string, columnId: string, position: string) => ({
  id,
  columnId,
  position,
  updatedAt: 1,
  deletedAt: null,
})

/** Two boards: the card starts on one, and is dragged onto the other. */
function seed() {
  rows.set(`${DASHBOARDS}/here`, board("here"))
  rows.set(`${COLUMNS}/here-todo`, column("here-todo", "here", "a0"))
  rows.set(`${CARDS}/moved`, card("moved", "here-todo", "a0"))

  rows.set(`${DASHBOARDS}/there`, board("there"))
  rows.set(`${COLUMNS}/there-second`, column("there-second", "there", "a1"))
  rows.set(`${COLUMNS}/there-first`, column("there-first", "there", "a0"))
  rows.set(`${CARDS}/sitting`, card("sitting", "there-first", "a0"))
}

const cardRow = (id: string) =>
  rows.get(`${CARDS}/${id}`) as { columnId: string; position: string }

beforeEach(() => {
  rows.clear()
  kvStore.clear()
  installRuntime({ db, kv, net, http } as unknown as Runtime)
})

async function loadMoveCardToBoard() {
  const { moveCardToBoard } =
    await import("../src/api/operations/move-card-to-board")
  return moveCardToBoard
}

describe("moveCardToBoard", () => {
  it("moves the card to the top of the target board's first column", async () => {
    seed()

    await (
      await loadMoveCardToBoard()
    )("moved", "there")

    expect(cardRow("moved").columnId).toBe("there-first")
    // Above what was already there, and the sitting card is left alone.
    expect(cardRow("moved").position < cardRow("sitting").position).toBe(true)
    expect(cardRow("sitting").columnId).toBe("there-first")
  })

  it("marks the moved card dirty so the move syncs", async () => {
    seed()
    const { sync } = await import("../src/api/sync/sync-engine")

    await (
      await loadMoveCardToBoard()
    )("moved", "there")

    expect(sync.getState().pending).toBe(1)
  })

  it("leaves the card where it is when the target board has no columns", async () => {
    seed()
    rows.delete(`${COLUMNS}/there-first`)
    rows.delete(`${COLUMNS}/there-second`)

    await (
      await loadMoveCardToBoard()
    )("moved", "there")

    expect(cardRow("moved").columnId).toBe("here-todo")
  })
})
