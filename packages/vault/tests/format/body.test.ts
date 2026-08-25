import { describe, expect, it } from "vitest"
import { canonicalBody } from "../../src/format/body"

describe("canonicalBody", () => {
  it("is what a save that only added a newline collapses to", () => {
    expect(canonicalBody("Body\n")).toBe("Body")
    expect(canonicalBody("Body  \n\n\n")).toBe("Body")
    expect(canonicalBody("\n\nBody")).toBe("Body")
    expect(canonicalBody("Body\r\nmore")).toBe("Body\nmore")
  })

  it("keeps the indentation of the first line", () => {
    expect(canonicalBody("\n    code()")).toBe("    code()")
  })
})
