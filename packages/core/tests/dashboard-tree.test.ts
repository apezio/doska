import { describe, expect, it } from "vitest"
import type { Dashboard } from "../src/types"
import {
  flattenDashboards,
  isSelfOrDescendant,
  moveToIndex,
  moveToParent,
} from "../src/utils/dashboard-tree"

function board(
  id: string,
  position: string,
  parentId: string | null = null
): Dashboard {
  return {
    id,
    title: id,
    position,
    sort: [],
    parentId,
    updatedAt: 1,
    deletedAt: null,
  }
}

/**
 *   A
 *   ├─ A1
 *   └─ A2
 *   B
 *   C
 *   └─ C1
 */
const tree = [
  board("C", "a2"),
  board("A2", "a1", "A"),
  board("A", "a0"),
  board("B", "a1"),
  board("C1", "a0", "C"),
  board("A1", "a0", "A"),
]

const idsOf = (rows: { dashboard: Dashboard; depth: number }[]) =>
  rows.map((r) => `${"  ".repeat(r.depth)}${r.dashboard.id}`)

describe("flattenDashboards", () => {
  it("orders siblings by position and indents children under their parent", () => {
    expect(idsOf(flattenDashboards(tree))).toEqual([
      "A",
      "  A1",
      "  A2",
      "B",
      "C",
      "  C1",
    ])
  })

  it("shows a board whose parent is gone at the top level", () => {
    // C1 (position a0) keeps its own position, so it sorts ahead of B (a1).
    const orphaned = tree.filter((d) => d.id !== "C")
    expect(idsOf(flattenDashboards(orphaned))).toEqual([
      "A",
      "  A1",
      "  A2",
      "C1",
      "B",
    ])
  })

  it("treats a record written before nesting existed as top-level", () => {
    const legacy = { ...board("L", "a3"), parentId: undefined } as unknown as Dashboard
    expect(idsOf(flattenDashboards([...tree, legacy]))).toContain("L")
  })

  it("shows every board once even when sync stitched a cycle", () => {
    const cycle = [board("X", "a0", "Y"), board("Y", "a1", "X"), board("Z", "a2")]
    const ids = flattenDashboards(cycle).map((r) => r.dashboard.id)
    expect([...ids].sort()).toEqual(["X", "Y", "Z"])
    expect(new Set(ids).size).toBe(3)
  })
})

describe("isSelfOrDescendant", () => {
  it("is true for the board itself and everything below it", () => {
    expect(isSelfOrDescendant(tree, "A", "A")).toBe(true)
    expect(isSelfOrDescendant(tree, "A", "A1")).toBe(true)
    expect(isSelfOrDescendant(tree, "A", "B")).toBe(false)
    expect(isSelfOrDescendant(tree, "A1", "A")).toBe(false)
  })
})

describe("moveToParent (drop onto a board)", () => {
  it("nests a top-level board as the last child", () => {
    const move = moveToParent(tree, "B", "A")
    expect(move).toMatchObject({ id: "B", parentId: "A" })
    expect(move!.position > "a1").toBe(true)
  })

  it("moves a nested board between parents", () => {
    const move = moveToParent(tree, "A1", "C")
    expect(move).toMatchObject({ id: "A1", parentId: "C" })
    expect(move!.position > "a0").toBe(true)
  })

  it("refuses to nest a board under itself or its own descendant", () => {
    expect(moveToParent(tree, "A", "A")).toBeNull()
    expect(moveToParent(tree, "A", "A1")).toBeNull()
  })
})

describe("moveToIndex (drop between rows)", () => {
  // Rows with the moved board removed are what `index` counts through.
  it("reorders top-level boards", () => {
    // C to the very top: rows without C are [A, A1, A2, B, C1]; slot 0 is
    // before A.
    const move = moveToIndex(tree, "C", 0)
    expect(move).toMatchObject({ id: "C", parentId: null })
    expect(move!.position < "a0").toBe(true)
  })

  it("moves a board to the end of the top level", () => {
    const move = moveToIndex(tree, "A", 5)
    expect(move).toMatchObject({ id: "A", parentId: null })
    expect(move!.position > "a2").toBe(true)
  })

  it("reorders a board among its siblings", () => {
    // A2 above A1: rows without A2 are [A, A1, B, C, C1]; slot 1 is before A1.
    const move = moveToIndex(tree, "A2", 1)
    expect(move).toMatchObject({ id: "A2", parentId: "A" })
    expect(move!.position < "a0").toBe(true)
  })

  it("nests a board dropped just under a parent, before its first child", () => {
    // B under A: rows without B are [A, A1, A2, C, C1]; slot 1 is before A1.
    const move = moveToIndex(tree, "B", 1)
    expect(move).toMatchObject({ id: "B", parentId: "A" })
    expect(move!.position < "a0").toBe(true)
  })

  it("unnests a board dropped just past the end of its group", () => {
    // A2 between A's group and B: rows without A2 are [A, A1, B, C, C1];
    // slot 2 is before B, a top-level row.
    const move = moveToIndex(tree, "A2", 2)
    expect(move).toMatchObject({ id: "A2", parentId: null })
    expect(move!.position > "a0").toBe(true)
    expect(move!.position < "a1").toBe(true)
  })

  it("moves a board between parents", () => {
    // A1 under C: rows without A1 are [A, A2, B, C, C1]; slot 4 is before C1.
    const move = moveToIndex(tree, "A1", 4)
    expect(move).toMatchObject({ id: "A1", parentId: "C" })
    expect(move!.position < "a0").toBe(true)
  })

  it("refuses a slot inside the board's own subtree", () => {
    // A just before A2 would make A its own grandchild.
    expect(moveToIndex(tree, "A", 1)).toBeNull()
  })
})
