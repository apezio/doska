import { describe, expect, it } from "vitest"
import { mergeCard, type MergeInput } from "../../src/merge/merge"
import type { Projection } from "../../src/merge/projection"

const base: Projection = {
  id: "card-3f9a1b2c4d5e",
  title: "Fix the sync bug",
  body: "Body",
  deadline: null,
  priority: "",
}

const merge = (input: Partial<MergeInput>) =>
  mergeCard({ base, file: base, db: base, winner: "file", ...input })

describe("mergeCard", () => {
  it("does nothing when neither side moved", () => {
    const result = merge({})

    expect(result.patch).toEqual({})
    expect(result.rewrite).toBe(false)
    expect(result.conflicts).toEqual([])
  })

  it("takes a field only the file changed", () => {
    const result = merge({ file: { ...base, body: "Edited in vim" } })

    expect(result.patch).toEqual({ body: "Edited in vim" })
    expect(result.merged.body).toBe("Edited in vim")
    expect(result.rewrite).toBe(false)
  })

  it("keeps a field only the DB changed, and rewrites the file", () => {
    const result = merge({ db: { ...base, priority: "high" } })

    expect(result.patch).toEqual({})
    expect(result.merged.priority).toBe("high")
    expect(result.rewrite).toBe(true)
  })

  it("merges the two sides field by field", () => {
    const result = merge({
      file: { ...base, body: "From the file" },
      db: { ...base, deadline: "2026-09-01" },
    })

    expect(result.patch).toEqual({ body: "From the file" })
    expect(result.merged).toEqual({
      ...base,
      body: "From the file",
      deadline: "2026-09-01",
    })
    expect(result.conflicts).toEqual([])
    expect(result.rewrite).toBe(true)
  })

  it("is not a conflict when both sides made the same edit", () => {
    const same = { ...base, title: "Fix the crash" }
    const result = merge({ file: same, db: same })

    expect(result.conflicts).toEqual([])
    expect(result.patch).toEqual({})
    expect(result.rewrite).toBe(false)
  })

  it("gives a field both sides changed to the winner", () => {
    const file = { ...base, title: "From the file" }
    const db = { ...base, title: "From the app" }

    const fileWins = merge({ file, db, winner: "file" })
    expect(fileWins.conflicts).toEqual(["title"])
    expect(fileWins.patch).toEqual({ title: "From the file" })
    expect(fileWins.rewrite).toBe(false)

    const dbWins = merge({ file, db, winner: "db" })
    expect(dbWins.conflicts).toEqual(["title"])
    expect(dbWins.patch).toEqual({})
    expect(dbWins.merged.title).toBe("From the app")
    expect(dbWins.rewrite).toBe(true)
  })

  it("resolves each conflicting field on its own, one winner for all", () => {
    const result = merge({
      file: { ...base, title: "From the file", body: "From the file" },
      db: { ...base, title: "From the app", priority: "low" },
      winner: "db",
    })

    expect(result.conflicts).toEqual(["title"])
    expect(result.patch).toEqual({ body: "From the file" })
    expect(result.merged).toEqual({
      ...base,
      title: "From the app",
      body: "From the file",
      priority: "low",
    })
  })

  it("carries a cleared deadline across as null", () => {
    const result = merge({
      base: { ...base, deadline: "2026-09-01" },
      file: { ...base, deadline: null },
      db: { ...base, deadline: "2026-09-01" },
    })

    expect(result.patch).toEqual({ deadline: null })
  })

  it("never merges the id", () => {
    const result = merge({ file: { ...base, id: "card-000000000000" } })

    expect(result.patch).toEqual({})
    expect(result.merged.id).toBe(base.id)
  })
})
