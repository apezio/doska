import { test, expect } from "@playwright/test"
import {
  addCard,
  cardPriorityLabel,
  columnCardTitles,
  createBoard,
  dragCardByTitle,
  retitleCard,
  setCardPriority,
  toggleSort,
} from "../helpers"

test.describe("card priority and board sort", () => {
  test("setting a priority from the board card's meta row shows the chip", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await setCardPriority(page, "Untitled card", "High")

    await expect(cardPriorityLabel(page, "Untitled card")).toHaveAttribute(
      "aria-label",
      "Priority: High"
    )
  })

  test("sorting by priority orders a column and puts unset cards last", async ({
    page,
  }) => {
    await createBoard(page)

    for (const title of ["None", "Low", "Medium", "High"]) {
      await addCard(page, "To Do")
      await retitleCard(page, "Untitled card", title)
    }
    await setCardPriority(page, "High", "High")
    await setCardPriority(page, "Medium", "Medium")
    await setCardPriority(page, "Low", "Low")

    await toggleSort(page, "Sort by priority")

    await expect
      .poll(() => columnCardTitles(page, "To Do"))
      .toEqual(["High", "Medium", "Low", "None"])
  })

  test("dragging within a sorted column does not change the order", async ({
    page,
  }) => {
    await createBoard(page)

    for (const title of ["Low", "Medium", "High"]) {
      await addCard(page, "To Do")
      await retitleCard(page, "Untitled card", title)
    }
    await setCardPriority(page, "High", "High")
    await setCardPriority(page, "Medium", "Medium")
    await setCardPriority(page, "Low", "Low")
    await toggleSort(page, "Sort by priority")
    await expect
      .poll(() => columnCardTitles(page, "To Do"))
      .toEqual(["High", "Medium", "Low"])

    await dragCardByTitle(page, "High", ["ArrowDown"])

    await expect
      .poll(() => columnCardTitles(page, "To Do"))
      .toEqual(["High", "Medium", "Low"])
  })

  test("dragging to another column while sorted renders at the sorted rank, and clearing the sort keeps the moved card on top", async ({
    page,
  }) => {
    await createBoard(page)

    await addCard(page, "In Progress")
    await retitleCard(page, "Untitled card", "Existing")
    await setCardPriority(page, "Existing", "High")

    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Mover")
    await setCardPriority(page, "Mover", "Low")

    await toggleSort(page, "Sort by priority")
    await expect
      .poll(() => columnCardTitles(page, "In Progress"))
      .toEqual(["Existing"])

    await dragCardByTitle(page, "Mover", ["ArrowRight"])

    // Sorted: "Mover" (low) ranks below "Existing" (high).
    await expect
      .poll(() => columnCardTitles(page, "In Progress"))
      .toEqual(["Existing", "Mover"])

    await toggleSort(page, "Sort by priority")

    // Sort off: manual order, moved card at the top of its new column.
    await expect
      .poll(() => columnCardTitles(page, "In Progress"))
      .toEqual(["Mover", "Existing"])
  })
})
