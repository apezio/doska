import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import type { Card } from "@doska/contract"
import { getDB } from "../src/db/get-db"
import { cards } from "../src/db/schema"
import {
  callTool,
  mcpToken,
  rpcClient,
  resetTables,
  startServer,
  toolJson,
  type Harness,
} from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>
let token: string

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
  token = await mcpToken(h, h.cookie)
})

beforeEach(resetTables)

const now = 1_000

function card(id: string, priority: number) {
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
      changes: [{ store: "cards", record: card("card1", 75) }],
    })

    const rows = await getDB().select().from(cards)
    expect(rows[0].priority).toBe(75)

    const pulled = res.changes.find((c) => c.record.id === "card1")
    expect((pulled?.record as unknown as { priority: number }).priority).toBe(75)
  })

  test("a client still on the old scale has its level migrated on the way in", async () => {
    await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [
        {
          store: "cards",
          // An older client sends "medium". The cast is the point of the test:
          // the schema no longer types the enum, but the wire still carries it.
          record: {
            ...card("card1", 0),
            priority: "medium",
          } as unknown as Card,
        },
      ],
    })

    const rows = await getDB().select().from(cards)
    expect(rows[0].priority).toBe(50)
  })

  test("a priority off the scale is clamped rather than refused", async () => {
    // Sync is lenient on the way in — a rejected push would strand the whole
    // batch on the client. The MCP tools, where a person or agent is typing,
    // refuse it instead.
    await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1", 101) }],
    })

    const rows = await getDB().select().from(cards)
    expect(rows[0].priority).toBe(100)
  })

  test("a card pushed without a priority defaults to 0, not null", async () => {
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
    expect(rows[0].priority).toBe(0)
  })

  test("a later push updates the priority", async () => {
    const first = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1", 75) }],
    })

    const second = await client.board.sync({
      boardId: "b1",
      since: first.cursor,
      changes: [
        { store: "cards", record: { ...card("card1", 25), updatedAt: now + 1 } },
      ],
    })

    const rows = await getDB().select().from(cards)
    expect(rows[0].priority).toBe(25)
    expect(
      (
        second.changes.find((c) => c.record.id === "card1")
          ?.record as unknown as { priority: number }
      ).priority
    ).toBe(25)
  })
})

describe("card priority over MCP", () => {
  const call = (name: string, args?: Record<string, unknown>) =>
    callTool(h, token, name, args)

  /** A fresh board with one card, returned as {boardId, columnId, card}. */
  async function seed(args: Record<string, unknown> = {}) {
    const board = toolJson(await call("create_board", { title: "Roadmap" }))
    const boardId: string = board.board.id
    const columnId: string = board.columns[0].id
    const created = toolJson(
      await call("create_card", { boardId, columnId, title: "Card", ...args })
    )
    return { boardId, columnId, card: created }
  }

  test("create_card stores a priority and get_card reads it back", async () => {
    const { boardId, card } = await seed({ priority: 80 })
    expect(card.priority).toBe(80)

    const read = toolJson(await call("get_card", { boardId, cardId: card.id }))
    expect(read.priority).toBe(80)
  })

  test("a card created without one has no priority", async () => {
    const { card } = await seed()
    expect(card.priority).toBeNull()
  })

  test("update_card changes it, and null clears it", async () => {
    const { boardId, card } = await seed({ priority: 80 })

    const lowered = toolJson(
      await call("update_card", { boardId, cardId: card.id, priority: 20 })
    )
    expect(lowered.priority).toBe(20)

    const cleared = toolJson(
      await call("update_card", { boardId, cardId: card.id, priority: null })
    )
    expect(cleared.priority).toBeNull()
  })

  test("update_card leaves the priority alone when it isn't passed", async () => {
    const { boardId, card } = await seed({ priority: 50 })

    const renamed = toolJson(
      await call("update_card", { boardId, cardId: card.id, title: "Renamed" })
    )
    expect(renamed.title).toBe("Renamed")
    expect(renamed.priority).toBe(50)
  })

  test("search_cards filters by a priority range", async () => {
    const { boardId, columnId } = await seed({ priority: 80 })
    await call("create_card", {
      boardId,
      columnId,
      title: "Someday",
      priority: 20,
    })

    const high = toolJson(await call("search_cards", { priorityMin: 60 }))
    expect(high.cards.map((c: { title: string }) => c.title)).toEqual(["Card"])

    const low = toolJson(await call("search_cards", { priorityMax: 40 }))
    expect(low.cards.map((c: { title: string }) => c.title)).toEqual(["Someday"])

    const band = toolJson(
      await call("search_cards", { priorityMin: 10, priorityMax: 90 })
    )
    expect(band.cards.map((c: { title: string }) => c.title).sort()).toEqual([
      "Card",
      "Someday",
    ])
  })

  test("a priority off the 0-100 scale is refused at the tool boundary", async () => {
    const board = toolJson(await call("create_board", { title: "Roadmap" }))
    const result = await call("create_card", {
      boardId: board.board.id,
      columnId: board.columns[0].id,
      title: "Card",
      priority: 101,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain("priority")
  })

  test("a level from the old scale is refused at the tool boundary", async () => {
    const board = toolJson(await call("create_board", { title: "Roadmap" }))
    const result = await call("create_card", {
      boardId: board.board.id,
      columnId: board.columns[0].id,
      title: "Card",
      priority: "high",
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain("priority")
  })
})
