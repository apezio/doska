import type { Card } from "@doska/contract"
import { describe, expect, it } from "vitest"
import { CardFile } from "../../src/format/card-file"

function card(fields: Partial<Card> = {}): Card {
  return {
    id: "card-3f9a1b2c4d5e",
    title: "Fix the sync bug",
    body: "Body verbatim.",
    position: "a",
    columnId: "todo",
    number: 12,
    deadline: "2026-09-01",
    priority: "high",
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    ...fields,
  }
}

const cardFile = (
  fields: Record<string, unknown> = {},
  body = "Body verbatim."
) =>
  new CardFile(
    {
      id: "card-3f9a1b2c4d5e",
      title: "Fix the sync bug",
      deadline: "2026-09-01",
      priority: "high",
      aliases: ["12"],
      ...fields,
    },
    body
  )

const roundTrip = (file: CardFile) => CardFile.parse(file.text)

describe("CardFile.text", () => {
  it("writes the documented shape", () => {
    expect(cardFile().text).toBe(
      `---
id: card-3f9a1b2c4d5e
title: "Fix the sync bug"
deadline: 2026-09-01
priority: high
aliases:
  - "12"
---
Body verbatim.
`
    )
  })

  it("leaves out what isn't set", () => {
    const bare = CardFile.fromCard(
      card({ body: "", deadline: null, priority: "", number: null })
    )

    expect(bare.text).toBe(
      '---\nid: card-3f9a1b2c4d5e\ntitle: "Fix the sync bug"\n---\n'
    )
  })

  it("keeps the order the user's frontmatter came in", () => {
    const text =
      '---\ncssclasses: wide\ntitle: "Hi"\nid: card-3f9a1b2c4d5e\n---\n'

    expect(CardFile.parse(text).text).toBe(text)
  })
})

describe("CardFile.parse", () => {
  it("round-trips", () => {
    expect(roundTrip(cardFile())).toEqual(cardFile())
  })

  it("round-trips a title full of quotes, dashes and colons", () => {
    const title = `He said "no": a - b\\c`
    expect(roundTrip(cardFile({ title })).title).toBe(title)
  })

  it("keeps a --- inside the body", () => {
    const body = "Above\n\n---\n\nBelow"
    expect(roundTrip(cardFile({}, body)).body).toBe(body)
  })

  it("reads CRLF and a body that opens with a blank line", () => {
    const file = CardFile.parse(
      '---\r\nid: card-3f9a1b2c4d5e\r\ntitle: "Hi"\r\n---\r\n\r\nBody\r\n\r\n'
    )

    expect(file.body).toBe("Body")
    expect(file.title).toBe("Hi")
  })

  it("passes frontmatter the mirror doesn't own through", () => {
    const file = CardFile.parse(`---
title: "Kept"
tags:
  - work
  - "quoted, comma"
cssclasses: wide
---
Body
`)

    expect(file.extra).toEqual({
      tags: ["work", "quoted, comma"],
      cssclasses: "wide",
    })
    // Values survive; the dumper owns the layout, so writing it back settles.
    const written = file.text
    expect(CardFile.parse(written).extra).toEqual(file.extra)
    expect(CardFile.parse(written).text).toBe(written)
  })

  it("keeps an unquoted ISO deadline a string, not a date", () => {
    expect(CardFile.parse("---\ndeadline: 2026-09-01\n---\n").deadline).toBe(
      "2026-09-01"
    )
  })

  it("owns the number alias and leaves the user's alone", () => {
    const file = CardFile.parse(
      '---\ntitle: "Hi"\naliases:\n  - "12"\n  - nickname\n---\n'
    )

    expect(file.number).toBe(12)
    expect(file.aliases).toEqual(["nickname"])
  })

  it("reads an inline alias list", () => {
    const file = CardFile.parse('---\naliases: ["12", "a, b"]\n---\n')

    expect(file.number).toBe(12)
    expect(file.aliases).toEqual(["a, b"])
  })

  it("reads single-quoted and plain scalars", () => {
    const file = CardFile.parse(
      "---\ntitle: 'it''s here'\npriority: high\n---\n"
    )

    expect(file.title).toBe("it's here")
    expect(file.priority).toBe("high")
  })

  it("takes an empty value as unset", () => {
    const file = CardFile.parse("---\ntitle:\ndeadline:\n---\n")

    expect(file.title).toBeNull()
    expect(file.deadline).toBeNull()
  })

  it("treats a file with no frontmatter as all body", () => {
    const file = CardFile.parse("Just a note\n")

    expect(file.id).toBeNull()
    expect(file.body).toBe("Just a note")
  })

  it("treats an unterminated frontmatter as all body", () => {
    const file = CardFile.parse("---\nid: card-3f9a1b2c4d5e\nno close\n")

    expect(file.id).toBeNull()
    expect(file.body).toBe("---\nid: card-3f9a1b2c4d5e\nno close")
  })

  it("gives frontmatter it can't read no id, so nothing touches the file", () => {
    const file = CardFile.parse("---\nid: [unclosed\n---\nBody\n")

    expect(file.id).toBeNull()
  })
})

describe("CardFile.fromCard", () => {
  it("takes the card's fields and keeps the file's own frontmatter", () => {
    const file = CardFile.fromCard(
      card({ title: "Fix", body: "Body\n\n", deadline: null, priority: "" }),
      new CardFile({ aliases: ["nickname"], tags: ["work"] })
    )

    expect(file.id).toBe("card-3f9a1b2c4d5e")
    expect(file.title).toBe("Fix")
    expect(file.deadline).toBeNull()
    expect(file.priority).toBeNull()
    expect(file.number).toBe(12)
    expect(file.aliases).toEqual(["nickname"])
    expect(file.extra).toEqual({ tags: ["work"] })
    expect(file.body).toBe("Body")
  })
})

describe("CardFile.resolveTitle", () => {
  const titled = (title: string | null) => new CardFile({ title })

  it("keeps the title when neither side moved", () => {
    expect(
      titled("Fix the sync bug").resolveTitle(
        "fix-the-sync-bug",
        "Fix the sync bug"
      )
    ).toBe("Fix the sync bug")
  })

  it("reads a rename off the filename", () => {
    expect(
      titled("Fix the sync bug").resolveTitle(
        "fix-the-crash",
        "Fix the sync bug"
      )
    ).toBe("fix the crash")
  })

  it("prefers frontmatter when the same save changed both", () => {
    expect(
      titled("Fix the crash").resolveTitle("fix-the-typo", "Fix the sync bug")
    ).toBe("Fix the crash")
  })

  it("falls back to the filename when there is no frontmatter title", () => {
    expect(titled(null).resolveTitle("fix-the-crash", "Fix the sync bug")).toBe(
      "fix the crash"
    )
    expect(
      titled(null).resolveTitle("fix-the-sync-bug", "Fix the sync bug")
    ).toBe("Fix the sync bug")
  })
})
