import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import type { Dashboard } from "@doska/contract"
import { getDB } from "../src/db/get-db"
import { dashboards } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

const now = 1_000

function board(id: string, parentId: string | null, position = "a"): Dashboard {
  return {
    id,
    title: id,
    position,
    sort: [],
    parentId,
    updatedAt: now,
    deletedAt: null,
  }
}

const parentOf = (
  res: { changes: { record: { id: string; parentId: string | null } }[] },
  id: string
) => res.changes.find((c) => c.record.id === id)?.record.parentId

describe("dashboard nesting sync", () => {
  test("persists the parent to the DB and reads it back", async () => {
    const res = await client.dashboards.sync({
      since: 0,
      changes: [
        { store: "dashboards", record: board("p", null) },
        { store: "dashboards", record: board("c", "p") },
      ],
    })

    const rows = await getDB().select().from(dashboards)
    expect(rows.find((r) => r.id === "c")?.parentId).toBe("p")
    expect(rows.find((r) => r.id === "p")?.parentId).toBeNull()

    expect(parentOf(res, "c")).toBe("p")
    expect(parentOf(res, "p")).toBeNull()
  })

  test("a board pushed without a parent, by a client before nesting, is top-level", async () => {
    const res = await client.dashboards.sync({
      since: 0,
      changes: [
        {
          store: "dashboards",
          record: {
            id: "old",
            title: "Old",
            position: "a",
            updatedAt: now,
            deletedAt: null,
          } as unknown as Dashboard,
        },
      ],
    })

    const rows = await getDB().select().from(dashboards)
    expect(rows[0].parentId).toBeNull()
    expect(parentOf(res, "old")).toBeNull()
  })

  test("later pushes reorder, nest, unnest and move between parents", async () => {
    const first = await client.dashboards.sync({
      since: 0,
      changes: [
        { store: "dashboards", record: board("p", null, "a0") },
        { store: "dashboards", record: board("q", null, "a1") },
        { store: "dashboards", record: board("c", null, "a2") },
      ],
    })

    const push = async (since: number, record: Dashboard) =>
      client.dashboards.sync({
        since,
        changes: [{ store: "dashboards", record }],
      })
    const read = async (id: string) =>
      (await getDB().select().from(dashboards)).find((r) => r.id === id)

    // Reorder at the top level.
    let res = await push(first.cursor, { ...board("c", null, "Zz"), updatedAt: now + 1 })
    expect(await read("c")).toMatchObject({ position: "Zz", parentId: null })

    // Nest under p.
    res = await push(res.cursor, { ...board("c", "p", "a0"), updatedAt: now + 2 })
    expect(await read("c")).toMatchObject({ position: "a0", parentId: "p" })
    expect(parentOf(res, "c")).toBe("p")

    // Move between parents.
    res = await push(res.cursor, { ...board("c", "q", "a0"), updatedAt: now + 3 })
    expect((await read("c"))?.parentId).toBe("q")

    // Unnest.
    res = await push(res.cursor, { ...board("c", null, "a3"), updatedAt: now + 4 })
    expect((await read("c"))?.parentId).toBeNull()
    expect(parentOf(res, "c")).toBeNull()
  })

  test("an older write cannot undo a newer nesting (last writer wins)", async () => {
    const first = await client.dashboards.sync({
      since: 0,
      changes: [
        { store: "dashboards", record: board("p", null) },
        { store: "dashboards", record: { ...board("c", "p"), updatedAt: now + 5 } },
      ],
    })
    await client.dashboards.sync({
      since: first.cursor,
      changes: [{ store: "dashboards", record: board("c", null) }],
    })
    const rows = await getDB().select().from(dashboards)
    expect(rows.find((r) => r.id === "c")?.parentId).toBe("p")
  })
})
