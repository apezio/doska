import { describe, expect, it } from "vitest"
import { CardFile } from "../src/card-file"
import { makeCard } from "./fakes"

describe("CardFile", () => {
  it("writes a card as frontmatter plus body", () => {
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      body: "one\ntwo",
      deadline: "2026-09-01",
      priority: "high",
    })

    expect(CardFile.fromCard(card).text).toBe(
      `---\nid: ${card.id}\ntitle: Ship it\ndeadline: 2026-09-01\npriority: high\n---\none\ntwo\n`
    )
  })

  it("round trips", () => {
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      body: "body",
      deadline: "2026-09-01",
      priority: "low",
    })
    const parsed = CardFile.parse(CardFile.fromCard(card).text)

    expect(parsed.id).toBe(card.id)
    expect(parsed.title).toBe("Ship it")
    expect(parsed.body).toBe("body")
    expect(parsed.deadline).toBe("2026-09-01")
    expect(parsed.priority).toBe("low")
    expect(parsed.patchFor(card)).toBeNull()
  })

  it("reads a file with no frontmatter as all body", () => {
    const parsed = CardFile.parse("just a note\n")
    expect(parsed.id).toBe("")
    expect(parsed.body).toBe("just a note")
  })

  it("reads broken frontmatter as all body rather than throwing", () => {
    const parsed = CardFile.parse("---\nid: [unclosed\n---\nbody\n")
    expect(parsed.id).toBe("")
    expect(parsed.body).toContain("body")
  })

  it("patches only the fields the file changed", () => {
    const card = makeCard({ columnId: "col-1", title: "Old", body: "same" })
    const edited = CardFile.parse(
      CardFile.fromCard(card).text.replace("title: Old", "title: New")
    )

    expect(edited.patchFor(card)).toEqual({ title: "New" })
  })

  it("clears a deadline the file dropped", () => {
    const card = makeCard({ columnId: "col-1", deadline: "2026-09-01" })
    const edited = CardFile.parse(
      CardFile.fromCard(card).text.replace("deadline: 2026-09-01\n", "")
    )

    expect(edited.patchFor(card)).toEqual({ deadline: null })
  })

  it("ignores a trailing newline an editor added", () => {
    const card = makeCard({ columnId: "col-1", body: "text" })
    const saved = CardFile.parse(`${CardFile.fromCard(card).text}\n\n`)

    expect(saved.patchFor(card)).toBeNull()
  })

  it("carries the number and attachments the board owns", () => {
    const card = makeCard({
      columnId: "col-1",
      title: "Ship it",
      number: 12,
      attachments: [
        {
          id: "a1",
          name: "plan.pdf",
          key: "att/00000000-0000-0000-0000-000000000000.pdf",
          mime: "application/pdf",
          size: 10,
        },
      ],
    })
    const parsed = CardFile.parse(CardFile.fromCard(card).text)

    expect(CardFile.fromCard(card).text).toContain("number: 12\n")
    expect(parsed.number).toBe(12)
    expect(parsed.attachments).toEqual(card.attachments)
    expect(parsed.patchFor(card)).toBeNull()
  })

  it("keeps frontmatter keys the user added", () => {
    const card = makeCard({ columnId: "col-1", title: "Ship it" })
    const parsed = CardFile.parse(
      `---\nid: ${card.id}\ntitle: Ship it\ntags: [ops]\n---\n`
    )

    expect(parsed.extra).toEqual({ tags: ["ops"] })
    expect(CardFile.fromCard(card, parsed.extra).text).toContain("tags:")
  })
})
