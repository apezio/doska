import { describe, expect, it } from "vitest"
import type { Dashboard } from "../src/types"
import {
  ancestorIds,
  applyMove,
  flattenDashboards,
  fullIndex,
  isSelfOrDescendant,
  moveToIndex,
  moveToParent,
  visibleRows,
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

/** {@link tree} with one more level: A1a under A1. */
const deep = [...tree, board("A1a", "a0", "A1")]

describe("visibleRows", () => {
  const visibleIds = (collapsed: string[]) =>
    idsOf(visibleRows(flattenDashboards(deep), new Set(collapsed)))

  it("shows every row when nothing is collapsed", () => {
    expect(visibleIds([])).toEqual(idsOf(flattenDashboards(deep)))
  })

  it("hides a collapsed board's whole subtree but keeps the board", () => {
    expect(visibleIds(["A"])).toEqual(["A", "B", "C", "  C1"])
    expect(visibleIds(["A1"])).toEqual(["A", "  A1", "  A2", "B", "C", "  C1"])
  })

  it("keeps a collapsed descendant folded under a collapsed ancestor", () => {
    expect(visibleIds(["A", "A1"])).toEqual(["A", "B", "C", "  C1"])
  })

  it("ignores a collapsed leaf", () => {
    expect(visibleIds(["B", "C1"])).toEqual(idsOf(flattenDashboards(deep)))
  })

  it("marks the boards that have children, folded or not", () => {
    const parents = visibleRows(flattenDashboards(deep), new Set(["A"]))
      .filter((r) => r.hasChildren)
      .map((r) => r.dashboard.id)
    expect(parents).toEqual(["A", "C"])
  })
})

describe("fullIndex (drop slot in the visible list)", () => {
  const rows = flattenDashboards(tree)
  // A collapsed: the sidebar shows [A, B, C, C1].
  const visible = visibleRows(rows, new Set(["A"]))

  it("is the same slot when nothing is hidden", () => {
    const all = visibleRows(rows, new Set())
    for (let i = 0; i <= 5; i++) expect(fullIndex(rows, all, "B", i)).toBe(i)
  })

  it("maps to the slot before the same row in the full list", () => {
    // C above B: visible without C is [A, B, C1], slot 1 is before B; the
    // full rows without C are [A, A1, A2, B, C1], where B sits at 3.
    expect(fullIndex(rows, visible, "C", 1)).toBe(3)
    const move = moveToIndex(tree, "C", 3)
    expect(move).toMatchObject({ id: "C", parentId: null })
    expect(move!.position > "a0" && move!.position < "a1").toBe(true)
  })

  it("keeps a board dropped right after a collapsed board out of its group", () => {
    // B between A and C: visible without B is [A, C, C1], slot 1 is before C.
    expect(fullIndex(rows, visible, "B", 1)).toBe(3)
    expect(moveToIndex(tree, "B", 3)).toMatchObject({ id: "B", parentId: null })
  })

  it("maps the end of the visible list to the end of the full list", () => {
    expect(fullIndex(rows, visible, "B", 3)).toBe(5)
  })
})

describe("ancestorIds", () => {
  const rows = flattenDashboards(deep)

  it("lists every board above, nearest first", () => {
    expect(ancestorIds(rows, "A1a")).toEqual(["A1", "A"])
    expect(ancestorIds(rows, "C1")).toEqual(["C"])
  })

  it("is empty for a top-level or unknown board", () => {
    expect(ancestorIds(rows, "B")).toEqual([])
    expect(ancestorIds(rows, "nope")).toEqual([])
  })
})

describe("applyMove", () => {
  it("lands the move in the tree the sidebar reads", () => {
    // A1 out of A's group and onto the top level, between B (a1) and C (a2).
    const next = applyMove(tree, { id: "A1", parentId: null, position: "a1V" })

    expect(idsOf(flattenDashboards(next))).toEqual([
      "A",
      "  A2",
      "B",
      "A1",
      "C",
      "  C1",
    ])
    expect(next.find((d) => d.id === "A1")).toMatchObject({
      parentId: null,
      position: "a1V",
    })
  })

  it("keeps the cache in the flat position order the query hands out", () => {
    const next = applyMove(tree, { id: "A1", parentId: null, position: "a1V" })

    expect(next.map((d) => d.position)).toEqual(
      [...next.map((d) => d.position)].sort()
    )
  })

  it("leaves the other boards — and the children that follow by reference — alone", () => {
    const next = applyMove(tree, { id: "A", parentId: "C", position: "a3" })

    // Only the moved board's record changes; A1/A2 still name A as their parent.
    for (const d of next) {
      if (d.id !== "A") expect(d).toBe(tree.find((t) => t.id === d.id))
    }
    expect(flattenDashboards(next).map((r) => r.dashboard.id)).toEqual([
      "B",
      "C",
      "C1",
      "A",
      "A1",
      "A2",
    ])
  })
})
