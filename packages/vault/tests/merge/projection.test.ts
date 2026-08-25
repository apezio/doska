import type { Card } from "@doska/contract"
import { describe, expect, it } from "vitest"
import { CardFile } from "../../src/format/card-file"
import {
  hashProjection,
  projectionOf,
  type Projection,
} from "../../src/merge/projection"

const projection: Projection = {
  id: "card-3f9a1b2c4d5e",
  title: "Fix the sync bug",
  body: "Body",
  deadline: null,
  priority: "",
}

function card(fields: Partial<Card> = {}): Card {
  return {
    id: "card-3f9a1b2c4d5e",
    title: "Fix the sync bug",
    body: "Body",
    position: "a",
    columnId: "todo",
    number: null,
    deadline: null,
    priority: "",
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    ...fields,
  }
}

describe("projectionOf", () => {
  it("canonicalizes the body and reads an unset field one way", () => {
    expect(projectionOf(card({ body: "Body\n\n", deadline: "" }))).toEqual(
      projection
    )
  })
})

describe("hashProjection", () => {
  it("is 64 hex chars and stable", async () => {
    const hash = await hashProjection(projection)

    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(await hashProjection({ ...projection })).toBe(hash)
  })

  it("moves when any mirrored field does", async () => {
    const hash = await hashProjection(projection)

    for (const other of [
      { ...projection, title: "Other" },
      { ...projection, body: "Other" },
      { ...projection, deadline: "2026-09-01" },
      { ...projection, priority: "high" },
      { ...projection, id: "card-000000000000" },
    ]) {
      expect(await hashProjection(other)).not.toBe(hash)
    }
  })

  it("cannot be moved by fields shifting between each other", async () => {
    const a = await hashProjection({ ...projection, title: "a", body: "b" })
    const b = await hashProjection({ ...projection, title: "ab", body: "" })

    expect(a).not.toBe(b)
  })

  it("ignores frontmatter the mirror doesn't own, and byte noise", async () => {
    const written = new CardFile(
      { id: projection.id, title: projection.title, aliases: ["12"] },
      projection.body
    ).text
    const edited = CardFile.parse(
      `${written.replace("---\n", "---\ntags: [work]\n")}\r\n\r\n`
    )

    expect(
      await hashProjection({
        ...projection,
        title: edited.title ?? "",
        body: edited.body,
      })
    ).toBe(await hashProjection(projection))
  })
})
