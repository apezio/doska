import { describe, expect, it } from "vitest"
import { sessionDefaults } from "./session-defaults"

const s = (mission: string, worktree: string, branch: string) => ({
  mission,
  worktree,
  branch,
})

describe("sessionDefaults", () => {
  it("names the mission after the project and follows an existing worktree", () => {
    expect(
      sessionDefaults("Routing / BGP", [
        s("quiet-birch", "/w/quiet-birch", "claude/quiet-birch"),
      ])
    ).toEqual({
      mission: "routing-bgp",
      worktree: "/w/routing-bgp",
      branch: "claude/routing-bgp",
    })
  })

  it("skips mission names already in use", () => {
    expect(
      sessionDefaults("Routing", [
        s("routing", "/w/routing", "claude/routing"),
        s("routing-2", "/w/routing-2", "claude/routing-2"),
      ]).mission
    ).toBe("routing-3")
  })

  it("learns no worktrees dir from a session outside the layout", () => {
    expect(
      sessionDefaults("Ops", [s("", "/home/me", "")]).worktree
    ).toBe("")
  })
})
