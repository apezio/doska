import { describe, expect, it } from "vitest"
import {
  cardFileName,
  deslug,
  dirPath,
  folderName,
  joinPath,
  parseCardFileName,
  slug,
  uniqueName,
} from "../../src/format/paths"

describe("slug", () => {
  it("lowercases and collapses everything else to one dash", () => {
    expect(slug("Fix the sync bug")).toBe("fix-the-sync-bug")
    expect(slug("Fix: the / sync?? bug")).toBe("fix-the-sync-bug")
    expect(slug("  spaced  out  ")).toBe("spaced-out")
  })

  it("keeps letters that aren't ascii", () => {
    expect(slug("Починить синк")).toBe("починить-синк")
    expect(slug("日本語 2")).toBe("日本語-2")
  })

  it("is empty when nothing survives", () => {
    expect(slug("!!!")).toBe("")
    expect(slug("")).toBe("")
  })

  it("stops at 60 chars, never on a dash", () => {
    expect(slug("a".repeat(58) + " bbbb")).toHaveLength(60)
    expect(slug("a".repeat(59) + " b")).toBe("a".repeat(59))
  })
})

describe("deslug", () => {
  it("puts the spaces back", () => {
    expect(deslug("fix-the-sync-bug")).toBe("fix the sync bug")
    expect(deslug("")).toBe("")
  })
})

describe("card filenames", () => {
  it("goes both ways with a number", () => {
    const name = cardFileName("12", "Fix the sync bug")

    expect(name).toBe("12-fix-the-sync-bug.md")
    expect(parseCardFileName(name)).toEqual({
      number: 12,
      id: null,
      slug: "fix-the-sync-bug",
    })
  })

  it("goes both ways with an id, dash and all", () => {
    const name = cardFileName("card-3f9a1b2c4d5e", "Fix the sync bug")

    expect(name).toBe("card-3f9a1b2c4d5e-fix-the-sync-bug.md")
    expect(parseCardFileName(name)).toEqual({
      number: null,
      id: "card-3f9a1b2c4d5e",
      slug: "fix-the-sync-bug",
    })
  })

  it("reads an empty slug", () => {
    expect(parseCardFileName("12-.md")).toEqual({
      number: 12,
      id: null,
      slug: "",
    })
  })

  it("reads a slug that starts with digits", () => {
    expect(parseCardFileName("123-456-x.md")).toEqual({
      number: 123,
      id: null,
      slug: "456-x",
    })
  })

  it("is null for anything that isn't a card file", () => {
    expect(parseCardFileName("notes.md")).toBeNull()
    expect(parseCardFileName("12-fix.txt")).toBeNull()
    expect(parseCardFileName("col-3f9a1b2c4d5e-fix.md")).toBeNull()
    expect(parseCardFileName("card-3f9a-fix.md")).toBeNull()
  })
})

describe("folderName", () => {
  it("keeps spaces and case", () => {
    expect(folderName("Where it lives", "col-1")).toBe("Where it lives")
    expect(folderName("Q3: ship / it", "col-1")).toBe("Q3- ship - it")
  })

  it("falls back to the id when nothing survives", () => {
    expect(folderName("///", "col-3f9a1b2c4d5e")).toBe("col-3f9a1b2c4d5e")
  })
})

describe("uniqueName", () => {
  it("numbers a name the folder already has, ignoring case", () => {
    expect(uniqueName("Inbox", [])).toBe("Inbox")
    expect(uniqueName("Inbox", ["inbox"])).toBe("Inbox (2)")
    expect(uniqueName("Inbox", ["Inbox", "inbox (2)"])).toBe("Inbox (3)")
  })
})

describe("path helpers", () => {
  it("joins, skipping the empty parts a root link leaves", () => {
    expect(joinPath("Board", "Column", "12-fix.md")).toBe(
      "Board/Column/12-fix.md"
    )
    expect(joinPath("", "Column", "12-fix.md")).toBe("Column/12-fix.md")
  })

  it("takes a path apart", () => {
    expect(dirPath("Board/Column/12-fix.md")).toBe("Board/Column")
    expect(dirPath("12-fix.md")).toBe("")
  })
})
