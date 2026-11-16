import { describe, expect, it } from "vitest"
import { countItems, isEmptyBlock, splitSummary } from "./summary-blocks"

const SUMMARY = `No customer is linked to the old account any more.

Done so far:
- The move is live.
- Cards copied.

Still open:
- Renewals to watch.
- Close the account in March.

Waiting on you:
- Nothing.

Next step: tracking review, between 2026-12-01 and 2026-12-30.`

describe("splitSummary", () => {
  it("splits the lead and the four labelled blocks", () => {
    expect(splitSummary(SUMMARY)).toEqual({
      lead: "No customer is linked to the old account any more.",
      done: "- The move is live.\n- Cards copied.",
      open: "- Renewals to watch.\n- Close the account in March.",
      waiting: "- Nothing.",
      next: "tracking review, between 2026-12-01 and 2026-12-30.",
    })
  })

  it("accepts bold labels and a plural next steps", () => {
    const s = splitSummary("Lead.\n\n**Still open:**\n- a\n\n**Next steps**:\n- b")
    expect(s?.open).toBe("- a")
    expect(s?.next).toBe("- b")
  })

  it("leaves a summary without labels alone", () => {
    expect(splitSummary("Just a line.\n\n- and a list")).toBeNull()
  })

  it("does not take a sentence that merely starts with a label's words", () => {
    expect(splitSummary("Still open questions remain.")).toBeNull()
  })

  it("joins a label that appears twice", () => {
    expect(splitSummary("Done so far:\n- a\nDone so far:\n- b")?.done).toBe(
      "- a\n- b"
    )
  })
})

describe("isEmptyBlock", () => {
  it.each(["", "Nothing.", "- Nothing.", "None", "n/a", "nothing right now"])(
    "%j says there is nothing",
    (md) => expect(isEmptyBlock(md)).toBe(true)
  )

  it("keeps a real item", () => {
    expect(isEmptyBlock("- Approve the refund")).toBe(false)
  })
})

describe("countItems", () => {
  it("counts list items", () => {
    expect(countItems("- a\n- b\n  more of b\n1. c")).toBe(3)
    expect(countItems("one paragraph")).toBe(0)
  })
})
