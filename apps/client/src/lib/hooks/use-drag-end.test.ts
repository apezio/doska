import { describe, expect, it, vi } from "vitest"
import type { DropResult } from "@hello-pangea/dnd"
import type { Board, Card } from "@doska/core/types"
import { useDragEnd } from "./use-drag-end"

const card = (id: string, columnId: string, fields: Partial<Card> = {}): Card =>
  ({
    id,
    title: id,
    body: "",
    columnId,
    priority: 0,
    deadline: null,
    number: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    ...fields,
  }) as Card

const board = (cards: Card[]): Board => ({ columns: [], cards })

const drop = (fields: Partial<DropResult>): DropResult =>
  ({
    reason: "DROP",
    mode: "FLUID",
    combine: null,
    draggableId: "moved",
    type: "DEFAULT",
    source: { droppableId: "todo", index: 0 },
    destination: { droppableId: "todo", index: 0 },
    ...fields,
  }) as DropResult

function moved(call: ReturnType<typeof vi.fn>) {
  return call.mock.calls[0]?.[0]?.[0] as Card | undefined
}

describe("useDragEnd", () => {
  describe("sort off (regression guard)", () => {
    it("a same-column drop lands at the drop index", () => {
      const cards = [
        card("a", "todo", { position: "a0" }),
        card("moved", "todo", { position: "a1" }),
        card("c", "todo", { position: "a2" }),
      ]
      const moveCard = vi.fn()
      const handleDragEnd = useDragEnd(board(cards), moveCard, [], vi.fn())

      handleDragEnd(
        drop({
          source: { droppableId: "todo", index: 1 },
          destination: { droppableId: "todo", index: 0 },
        }),
        null
      )

      expect(moveCard).toHaveBeenCalledTimes(1)
      expect(moved(moveCard)?.columnId).toBe("todo")
      expect(moved(moveCard)?.position).toBe("Zz")
    })

    it("a cross-column drop lands at the drop index", () => {
      const cards = [
        card("moved", "todo", { position: "a0" }),
        card("x", "doing", { position: "a0" }),
        card("y", "doing", { position: "a1" }),
      ]
      const moveCard = vi.fn()
      const handleDragEnd = useDragEnd(board(cards), moveCard, [], vi.fn())

      handleDragEnd(
        drop({
          source: { droppableId: "todo", index: 0 },
          destination: { droppableId: "doing", index: 1 },
        }),
        null
      )

      expect(moveCard).toHaveBeenCalledTimes(1)
      expect(moved(moveCard)?.columnId).toBe("doing")
      expect(moved(moveCard)?.position).toBe("a0V")
    })
  })

  describe("sort on", () => {
    it("a same-column drop still writes a fresh position (current behavior — see conversation)", () => {
      // Task 06's spec calls for a no-op here, but the shipped code has no
      // early exit for a same-column drop while sorted: it mints a position
      // among the moved card's same-priority tier regardless. Documented as
      // actual behavior per explicit direction, not endorsed as correct.
      const cards = [
        card("moved", "todo", { position: "a0", priority: 75 }),
        card("b", "todo", { position: "a1", priority: 75 }),
        card("c", "todo", { position: "a3", priority: 25 }),
      ]
      const moveCard = vi.fn()
      const handleDragEnd = useDragEnd(
        board(cards),
        moveCard,
        ["priority"],
        vi.fn()
      )

      handleDragEnd(
        drop({
          source: { droppableId: "todo", index: 0 },
          destination: { droppableId: "todo", index: 2 },
        }),
        null
      )

      expect(moveCard).toHaveBeenCalledTimes(1)
      expect(moved(moveCard)?.position).toBe("a2")
    })

    it("a cross-column drop lands above the destination's top regardless of destination.index, when the moved card ties with nothing there", () => {
      const cards = [
        card("moved", "todo", { position: "a0", priority: 50 }),
        card("top", "doing", { position: "a0", priority: 75 }),
        card("bottom", "doing", { position: "a1", priority: 25 }),
      ]
      const moveCard = vi.fn()
      const handleDragEnd = useDragEnd(
        board(cards),
        moveCard,
        ["priority"],
        vi.fn()
      )

      for (const destIndex of [0, 1, 2]) {
        handleDragEnd(
          drop({
            source: { droppableId: "todo", index: 0 },
            destination: { droppableId: "doing", index: destIndex },
          }),
          null
        )
      }

      expect(moveCard).toHaveBeenCalledTimes(3)
      for (const call of moveCard.mock.calls) {
        // A key minted against the destination's top, not the base key: cards
        // arrive at "a0", so minting that again would tie with one of them and
        // leave the order undefined once the sort is cleared.
        expect(call[0][0].position).toBe("Zz")
        expect(call[0][0].position < "a0").toBe(true)
      }
    })
  })

  describe("across boards", () => {
    /** A card let go over a sidebar row: no destination, a board underneath. */
    const overSidebar = drop({
      source: { droppableId: "todo", index: 0 },
      destination: null,
    })

    it("a card let go over another board's row moves to that board", () => {
      const cards = [card("moved", "todo", { position: "a0" })]
      const moveCard = vi.fn()
      const moveCardToBoard = vi.fn()
      const handleDragEnd = useDragEnd(
        board(cards),
        moveCard,
        [],
        moveCardToBoard
      )

      handleDragEnd(overSidebar, "other-board")

      expect(moveCardToBoard).toHaveBeenCalledWith({
        id: "moved",
        boardId: "other-board",
      })
      // The destination board's columns aren't loaded here, so there is no
      // position to mint: the landing column is picked where the move runs.
      expect(moveCard).not.toHaveBeenCalled()
    })

    it("takes the board under the pointer, not the first one", () => {
      const cards = [card("moved", "todo", { position: "a0" })]
      const moveCardToBoard = vi.fn()
      const handleDragEnd = useDragEnd(
        board(cards),
        vi.fn(),
        [],
        moveCardToBoard
      )

      handleDragEnd(overSidebar, "third-board")

      expect(moveCardToBoard).toHaveBeenCalledWith({
        id: "moved",
        boardId: "third-board",
      })
    })

    it("wins over a column destination, so a drop on a row never also reorders", () => {
      const cards = [
        card("moved", "todo", { position: "a0" }),
        card("x", "doing", { position: "a0" }),
      ]
      const moveCard = vi.fn()
      const moveCardToBoard = vi.fn()
      const handleDragEnd = useDragEnd(
        board(cards),
        moveCard,
        [],
        moveCardToBoard
      )

      handleDragEnd(
        drop({
          source: { droppableId: "todo", index: 0 },
          destination: { droppableId: "doing", index: 1 },
        }),
        "other-board"
      )

      expect(moveCardToBoard).toHaveBeenCalledWith({
        id: "moved",
        boardId: "other-board",
      })
      expect(moveCard).not.toHaveBeenCalled()
    })

    it("ignores a board drop for a card this board doesn't hold", () => {
      const moveCardToBoard = vi.fn()
      const handleDragEnd = useDragEnd(board([]), vi.fn(), [], moveCardToBoard)

      handleDragEnd(overSidebar, "other-board")

      expect(moveCardToBoard).not.toHaveBeenCalled()
    })

    it("does nothing when the card is let go over no board and no column", () => {
      const cards = [card("moved", "todo", { position: "a0" })]
      const moveCard = vi.fn()
      const moveCardToBoard = vi.fn()
      const handleDragEnd = useDragEnd(
        board(cards),
        moveCard,
        [],
        moveCardToBoard
      )

      handleDragEnd(overSidebar, null)

      expect(moveCardToBoard).not.toHaveBeenCalled()
      expect(moveCard).not.toHaveBeenCalled()
    })

    it("still treats a column drop as a column drop", () => {
      const cards = [
        card("moved", "todo", { position: "a0" }),
        card("x", "doing", { position: "a0" }),
      ]
      const moveCard = vi.fn()
      const moveCardToBoard = vi.fn()
      const handleDragEnd = useDragEnd(
        board(cards),
        moveCard,
        [],
        moveCardToBoard
      )

      handleDragEnd(
        drop({
          source: { droppableId: "todo", index: 0 },
          destination: { droppableId: "doing", index: 1 },
        }),
        null
      )

      expect(moveCardToBoard).not.toHaveBeenCalled()
      expect(moved(moveCard)?.columnId).toBe("doing")
    })
  })
})
