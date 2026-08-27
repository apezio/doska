import { test, expect } from "@playwright/test"
import {
  addCard,
  cardPriorityButton,
  cardPriorityText,
  columnCardTitles,
  createBoard,
  dragCardByTitle,
  retitleCard,
  setCardPriority,
  toggleSort,
} from "../helpers"

test.describe("card priority and board sort", () => {
  test("the number in a card's title row is editable in place", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await expect(cardPriorityButton(page, "Untitled card")).toHaveText("–")

    await setCardPriority(page, "Untitled card", 70)

    await expect(cardPriorityButton(page, "Untitled card")).toHaveText("70")
  })

  test("an edit survives a reload, and clearing it goes back to none", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await setCardPriority(page, "Untitled card", 42)

    await page.reload()
    await expect(cardPriorityButton(page, "Untitled card")).toHaveText("42")

    await setCardPriority(page, "Untitled card", "")
    await expect(cardPriorityButton(page, "Untitled card")).toHaveText("–")
  })

  test("a value above the scale is held at 100", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await setCardPriority(page, "Untitled card", 999)

    await expect(cardPriorityButton(page, "Untitled card")).toHaveText("100")
  })

  test("editing the number does not open the card", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await setCardPriority(page, "Untitled card", 30)

    await expect(page.getByPlaceholder("Notes")).toBeHidden()
    expect(await cardPriorityText(page, "Untitled card")).toBe("30")
  })

  test("sorting by priority orders a column and puts unset cards last", async ({
    page,
  }) => {
    await createBoard(page)

    for (const title of ["None", "Low", "Medium", "High"]) {
      await addCard(page, "To Do")
      await retitleCard(page, "Untitled card", title)
    }
    await setCardPriority(page, "High", 90)
    await setCardPriority(page, "Medium", 50)
    await setCardPriority(page, "Low", 10)

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
    await setCardPriority(page, "High", 90)
    await setCardPriority(page, "Medium", 50)
    await setCardPriority(page, "Low", 10)
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
    await setCardPriority(page, "Existing", 90)

    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Mover")
    await setCardPriority(page, "Mover", 10)

    await toggleSort(page, "Sort by priority")
    await expect
      .poll(() => columnCardTitles(page, "In Progress"))
      .toEqual(["Existing"])

    await dragCardByTitle(page, "Mover", ["ArrowRight"])

    // Sorted: "Mover" (10) ranks below "Existing" (90).
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
