import { describe, expect, it } from "vitest"
import { attachmentUnavailable } from "./attachment-labels"

describe("attachmentUnavailable", () => {
  it("blames the connection when sync has dropped", () => {
    expect(attachmentUnavailable({ status: "dropped", reason: "server" })).toBe(
      "Can't reach the server. Files are stored there."
    )
    expect(attachmentUnavailable({ status: "dropped", reason: "offline" })).toBe(
      "You're offline. Files are stored on the server."
    )
    expect(attachmentUnavailable({ status: "dropped", reason: "auth" })).toBe(
      "Signed out on the server. Sign in to see files."
    )
    expect(
      attachmentUnavailable({ status: "dropped", reason: "forbidden" })
    ).toBe("No access to this file.")
  })

  it("points a signed out reader at signing in", () => {
    expect(attachmentUnavailable({ status: "local" })).toBe(
      "Sign in to see files."
    )
  })

  // Sync is fine, so the server is answering and this one object is genuinely
  // gone. Claiming the server is away here would be a lie.
  it("does not blame the connection while sync is healthy", () => {
    expect(attachmentUnavailable({ status: "ok" })).toBe("File unavailable.")
  })
})
