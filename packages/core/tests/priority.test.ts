import { describe, expect, it } from "vitest"
import { CardSchema } from "@doska/contract"
import {
  clampPriority,
  priorityRank,
  toPriority,
} from "@doska/contract/priority"
import { priorityBand } from "@doska/tokens/priority"

describe("toPriority", () => {
  it("migrates the retired enum", () => {
    expect(toPriority("high")).toBe(75)
    expect(toPriority("medium")).toBe(50)
    expect(toPriority("low")).toBe(25)
    expect(toPriority("")).toBe(0)
  })

  it("reads a level however it was cased or padded", () => {
    expect(toPriority(" High ")).toBe(75)
  })

  it("keeps a number in range, as an integer", () => {
    expect(toPriority(0)).toBe(0)
    expect(toPriority(42)).toBe(42)
    expect(toPriority(100)).toBe(100)
    expect(toPriority(42.6)).toBe(43)
    expect(toPriority(140)).toBe(100)
    expect(toPriority(-5)).toBe(0)
  })

  it("parses a number that arrived as a string", () => {
    expect(toPriority("80")).toBe(80)
  })

  it("reads anything else as no priority", () => {
    expect(toPriority(undefined)).toBe(0)
    expect(toPriority(null)).toBe(0)
    expect(toPriority("urgent")).toBe(0)
    expect(toPriority(NaN)).toBe(0)
    expect(toPriority({})).toBe(0)
  })
})

describe("clampPriority", () => {
  it("holds the ends of the scale", () => {
    expect(clampPriority(-1)).toBe(0)
    expect(clampPriority(101)).toBe(100)
  })
})

describe("priorityRank", () => {
  it("ranks higher numbers first and no priority last", () => {
    expect(priorityRank(100)).toBeLessThan(priorityRank(99))
    expect(priorityRank(1)).toBeLessThan(priorityRank(0))
    expect(priorityRank(0)).toBe(priorityRank(""))
  })

  it("ranks a legacy level where its number would sit", () => {
    expect(priorityRank("high")).toBe(priorityRank(75))
  })
})

describe("priorityBand", () => {
  it("colours the scale in three bands, and nothing at zero", () => {
    expect(priorityBand(0)).toBe(null)
    expect(priorityBand(1)).toBe("low")
    expect(priorityBand(33)).toBe("low")
    expect(priorityBand(34)).toBe("medium")
    expect(priorityBand(66)).toBe("medium")
    expect(priorityBand(67)).toBe("high")
    expect(priorityBand(100)).toBe("high")
  })

  it("keeps each migrated level in the band it used to render as", () => {
    expect(priorityBand(toPriority("high"))).toBe("high")
    expect(priorityBand(toPriority("medium"))).toBe("medium")
    expect(priorityBand(toPriority("low"))).toBe("low")
  })
})

describe("CardSchema", () => {
  const card = (priority: unknown) =>
    CardSchema.parse({
      id: "c1",
      title: "Card",
      body: "",
      position: "a0",
      columnId: "col1",
      priority,
      updatedAt: 1,
      deletedAt: null,
    })

  it("normalises a priority written by an older client", () => {
    expect(card("medium").priority).toBe(50)
  })

  it("defaults a card that carries none", () => {
    expect(card(undefined).priority).toBe(0)
  })

  it("takes a number straight through", () => {
    expect(card(60).priority).toBe(60)
  })
})
