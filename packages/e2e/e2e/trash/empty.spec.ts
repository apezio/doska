import { test, expect } from "@playwright/test"
import {
  addCard,
  card,
  createBoard,
  openTrash,
  restoreFromTrash,
  retitleCard,
  trashEntry,
} from "../helpers"

/**
 * The trash's two resting states: nothing in it, and the retention notice that
 * comes with entries. (The 14-day sweep itself can't be driven from the UI in a
 * test — it needs the clock, not a click.)
 */
test.describe("empty trash", () => {
  test("says so when nothing has been deleted", async ({ page }) => {
    await createBoard(page)
    await openTrash(page)

    await expect(page.getByText("The trash is empty.")).toBeVisible()
    await expect(page.getByRole("list", { name: "Deleted items" })).toHaveCount(
      0
    )
  })

  test("an entry brings the retention notice with it, and leaves with it", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Throw me out")

    await card(page, "Throw me out")
      .getByRole("button", { name: "Card actions" })
      .click()
    await page.getByRole("menuitem", { name: "Delete" }).click()

    await openTrash(page)
    await expect(
      page.getByText("Items here are permanently deleted after 14 days.")
    ).toBeVisible()
    await expect(trashEntry(page, "Throw me out")).toBeVisible()

    await restoreFromTrash(page, "Throw me out")

    // Back to empty: the notice goes with the last entry.
    await expect(page.getByText("The trash is empty.")).toBeVisible()
    await expect(
      page.getByText("Items here are permanently deleted after 14 days.")
    ).toHaveCount(0)
  })
})
