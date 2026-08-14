import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import type { Card } from "@doska/contract"
import { getDB } from "../src/db/get-db"
import { cards } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

const now = 1_000

function card(id: string, priority: string) {
  return {
    id,
    title: "Card",
    body: "",
    position: "a",
    columnId: "c1",
    number: null,
    deadline: null,
    priority,
    attachments: [],
    updatedAt: now,
    deletedAt: null,
  }
}

describe("card priority sync", () => {
  test("persists the priority to the DB and reads it back", async () => {
    const res = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1", "high") }],
    })

    const rows = await getDB().select().from(cards)
    expect(rows[0].priority).toBe("high")

    const pulled = res.changes.find((c) => c.record.id === "card1")
    expect((pulled?.record as { priority: string }).priority).toBe("high")
  })

  test("a card pushed without a priority defaults to empty, not null", async () => {
    await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [
        {
          store: "cards",
          // A client on the previous version sends no priority at all — the cast
          // is the point of the test, so it has to defeat the schema's type.
          record: {
            id: "card2",
            title: "Card",
            body: "",
            position: "a",
            columnId: "c1",
            number: null,
            deadline: null,
            attachments: [],
            updatedAt: now,
            deletedAt: null,
          } as unknown as Card,
        },
      ],
    })

    const rows = await getDB().select().from(cards)
    expect(rows[0].priority).toBe("")
  })

  test("a later push updates the priority", async () => {
    const first = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1", "high") }],
    })

    const second = await client.board.sync({
      boardId: "b1",
      since: first.cursor,
      changes: [
        { store: "cards", record: { ...card("card1", "low"), updatedAt: now + 1 } },
      ],
    })

    const rows = await getDB().select().from(cards)
    expect(rows[0].priority).toBe("low")
    expect(
      (second.changes.find((c) => c.record.id === "card1")?.record as {
        priority: string
      }).priority
    ).toBe("low")
  })
})
