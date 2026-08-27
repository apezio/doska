import { describe, expect, it } from "vitest"
import type { Card, Column, Dashboard } from "../src/types"
import { groupOpenCards } from "../src/api/operations/get-open-cards"

const board = (id: string, fields: Partial<Dashboard> = {}): Dashboard =>
  ({ id, title: id, position: "a0", deletedAt: null, ...fields }) as Dashboard

const column = (
  id: string,
  dashboardId: string,
  position: string,
  fields: Partial<Column> = {}
): Column =>
  ({ id, dashboardId, position, deletedAt: null, ...fields }) as Column

const card = (id: string, columnId: string, fields: Partial<Card> = {}): Card =>
  ({
    id,
    columnId,
    title: id,
    body: "",
    priority: 0,
    number: null,
    deletedAt: null,
    ...fields,
  }) as Card

const ids = (entries: { card: Card }[]) => entries.map((e) => e.card.id)

const boards = [board("b1"), board("b2")]
const columns = [
  column("b1-todo", "b1", "a0"),
  column("b1-doing", "b1", "a1"),
  column("b1-done", "b1", "a2"),
  column("b1-extra", "b1", "a3"),
  column("b2-todo", "b2", "a0"),
  column("b2-doing", "b2", "a1"),
]

describe("groupOpenCards", () => {
  it("reads the first column as To Do and the second as In Progress, across boards", () => {
    const cards = [
      card("t1", "b1-todo"),
      card("d1", "b1-doing"),
      card("t2", "b2-todo"),
      card("d2", "b2-doing"),
    ]
    const result = groupOpenCards(cards, columns, boards)

    expect(ids(result.todo)).toEqual(["t1", "t2"])
    expect(ids(result.doing)).toEqual(["d1", "d2"])
    expect(result.todo[1].boardTitle).toBe("b2")
    expect(result.total).toBe(4)
  })

  it("leaves out done and later columns", () => {
    const cards = [card("done", "b1-done"), card("extra", "b1-extra")]

    expect(groupOpenCards(cards, columns, boards).total).toBe(0)
  })

  it("orders each pile by priority, then number", () => {
    const cards = [
      card("none", "b1-todo", { number: 1 }),
      card("low", "b1-todo", { priority: 25, number: 2 }),
      card("high-2", "b2-todo", { priority: 75, number: 2 }),
      card("high-1", "b1-todo", { priority: 75, number: 1 }),
    ]

    expect(ids(groupOpenCards(cards, columns, boards).todo)).toEqual([
      "high-1",
      "high-2",
      "low",
      "none",
    ])
  })

  it("caps the two piles together, To Do first, and still counts the rest", () => {
    const cards = [
      ...Array.from({ length: 7 }, (_, i) => card(`t${i}`, "b1-todo")),
      ...Array.from({ length: 6 }, (_, i) => card(`d${i}`, "b1-doing")),
    ]
    const result = groupOpenCards(cards, columns, boards, 10)

    expect(result.todo).toHaveLength(7)
    expect(result.doing).toHaveLength(3)
    expect(result.total).toBe(13)
  })

  it("skips cards whose column or board is tombstoned", () => {
    const cards = [card("gone-col", "b1-todo"), card("gone-board", "b2-todo")]
    const result = groupOpenCards(
      cards,
      [
        column("b1-todo", "b1", "a0", { deletedAt: 1 }),
        column("b2-todo", "b2", "a0"),
      ],
      [board("b1"), board("b2", { deletedAt: 1 })]
    )

    expect(result.total).toBe(0)
  })

  it("skips deleted cards", () => {
    const cards = [card("x", "b1-todo", { deletedAt: 1 })]

    expect(groupOpenCards(cards, columns, boards).total).toBe(0)
  })
})
