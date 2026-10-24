import type { ProjectSummary, Workstream } from "@doska/contract"
import { describe, expect, it } from "vitest"
import {
  groupProjects,
  pendingDependencies,
  timeAgo,
} from "../src/data/projects"

const project = (
  id: string,
  fields: Partial<ProjectSummary> = {}
): ProjectSummary =>
  ({
    id,
    status: "active",
    openDecisions: 0,
    openBlockers: 0,
    lastActivityAt: 0,
    ...fields,
  }) as ProjectSummary

const ws = (id: string, fields: Partial<Workstream> = {}): Workstream =>
  ({ id, status: "planned", dependsOn: [], ...fields }) as Workstream

const shape = (projects: ProjectSummary[]) =>
  groupProjects(projects).map((g) => [g.id, g.projects.map((p) => p.id)])

describe("groupProjects", () => {
  it("puts what waits on the owner first, then active, then the rest", () => {
    expect(
      shape([
        project("done", { status: "done" }),
        project("active"),
        project("blocked", { status: "blocked" }),
        project("paused", { status: "paused" }),
        project("asks", { openDecisions: 1 }),
      ])
    ).toEqual([
      ["attention", ["blocked", "asks"]],
      ["moving", ["active"]],
      ["resting", ["done", "paused"]],
    ])
  })

  it("orders by latest activity within a group and drops empty groups", () => {
    expect(
      shape([
        project("old", { lastActivityAt: 1 }),
        project("new", { lastActivityAt: 2 }),
      ])
    ).toEqual([["moving", ["new", "old"]]])
  })

  it("leaves a done project at rest even with a stale open blocker", () => {
    expect(shape([project("p", { status: "done", openBlockers: 1 })])).toEqual([
      ["resting", ["p"]],
    ])
  })
})

describe("pendingDependencies", () => {
  it("lists the dependencies that are not done, ignoring unknown ids", () => {
    const all = [
      ws("a", { status: "done" }),
      ws("b", { status: "active" }),
      ws("c", { dependsOn: ["a", "b", "gone"] }),
    ]

    expect(pendingDependencies(all[2], all).map((w) => w.id)).toEqual(["b"])
  })
})

describe("timeAgo", () => {
  const now = new Date(2026, 9, 24, 12).getTime()

  it("steps from minutes to hours to days", () => {
    expect(timeAgo(now - 10_000, now)).toBe("just now")
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5m ago")
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("3h ago")
    expect(timeAgo(now - 30 * 3_600_000, now)).toBe("yesterday")
    expect(timeAgo(now - 4 * 86_400_000, now)).toBe("4d ago")
  })
})
