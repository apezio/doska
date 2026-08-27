import { describe, expect, it } from "vitest"
import type { Card } from "../src/types"
import { sameSortGroup, sortCards } from "../src/utils"

const card = (id: string, fields: Partial<Card> = {}): Card =>
  ({
    id,
    position: id,
    title: id,
    body: "",
    priority: 0,
    deadline: null,
    ...fields,
  }) as Card

const ids = (cards: Card[], keys: string[]) =>
  sortCards(cards, keys).map((c) => c.id)

describe("sortCards", () => {
  it("returns the input untouched for no keys", () => {
    const cards = [card("b"), card("a")]

    expect(sortCards(cards, [])).toBe(cards)
  })

  it("orders by priority, highest first and unset last", () => {
    const cards = [
      card("none"),
      card("low", { priority: 25 }),
      card("high", { priority: 75 }),
      card("med", { priority: 50 }),
    ]

    expect(ids(cards, ["priority"])).toEqual(["high", "med", "low", "none"])
  })

  it("separates neighbouring numbers the old scale would have tied", () => {
    const cards = [
      card("b", { priority: 50 }),
      card("a", { priority: 51 }),
      card("c", { priority: 49 }),
    ]

    expect(ids(cards, ["priority"])).toEqual(["a", "b", "c"])
  })

  it("ranks a card left on the retired enum by what it migrates to", () => {
    const cards = [
      card("none"),
      card("legacy-high", { priority: "high" as unknown as number }),
      card("eighty", { priority: 80 }),
      card("ten", { priority: 10 }),
    ]

    expect(ids(cards, ["priority"])).toEqual([
      "eighty",
      "legacy-high",
      "ten",
      "none",
    ])
  })

  it("orders by deadline ascending, null last", () => {
    const cards = [
      card("none"),
      card("late", { deadline: "2026-09-01" }),
      card("soon", { deadline: "2026-08-15" }),
    ]

    expect(ids(cards, ["deadline"])).toEqual(["soon", "late", "none"])
  })

  it("breaks a priority tie with the next key", () => {
    const cards = [
      card("a", { priority: 75, deadline: "2026-09-01" }),
      card("b", { priority: 75, deadline: "2026-08-15" }),
      card("c", { priority: 25, deadline: "2026-01-01" }),
    ]

    expect(ids(cards, ["priority", "deadline"])).toEqual(["b", "a", "c"])
  })

  it("falls back to position once every key ties", () => {
    const cards = [
      card("second", { position: "a1", priority: 75 }),
      card("first", { position: "a0", priority: 75 }),
    ]

    expect(ids(cards, ["priority"])).toEqual(["first", "second"])
  })

  it("floats a blank card above every key", () => {
    const cards = [
      card("high", { priority: 75 }),
      card("blank", { title: "  ", body: "" }),
      card("low", { priority: 25 }),
    ]

    expect(ids(cards, ["priority"])).toEqual(["blank", "high", "low"])
  })

  it("keeps a titled card without a priority below the ranked ones", () => {
    const cards = [card("none"), card("high", { priority: 75 })]

    expect(ids(cards, ["priority"])).toEqual(["high", "none"])
  })

  it("handles an empty list", () => {
    expect(sortCards([], [])).toEqual([])
    expect(sortCards([], ["priority"])).toEqual([])
  })

  it("ignores a key it does not recognise", () => {
    const cards = [card("b", { position: "a1" }), card("a", { position: "a0" })]

    expect(ids(cards, ["colour"])).toEqual(["b", "a"])
    expect(ids(cards, ["colour", "priority"])).toEqual(["a", "b"])
  })
})

describe("sameSortGroup", () => {
  const high = card("a", { priority: 75, deadline: "2026-09-01" })
  const alsoHigh = card("b", { priority: 75, deadline: "2026-08-15" })
  const low = card("c", { priority: 25 })

  it("groups cards no key can separate", () => {
    expect(sameSortGroup(high, alsoHigh, ["priority"])).toBe(true)
    expect(sameSortGroup(high, low, ["priority"])).toBe(false)
  })

  it("separates them once a later key looks at them", () => {
    expect(sameSortGroup(high, alsoHigh, ["priority", "deadline"])).toBe(false)
  })

  it("groups everything when nothing sorts", () => {
    expect(sameSortGroup(high, low, [])).toBe(true)
    expect(sameSortGroup(high, low, ["colour"])).toBe(true)
  })
})
