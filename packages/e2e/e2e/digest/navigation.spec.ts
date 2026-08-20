import { test, expect } from "@playwright/test"
import {
  addCard,
  createBoard,
  digestRow,
  renameBoard,
  retitleCard,
  setDeadline,
} from "../helpers"

test.describe("digest navigation", () => {
  test("the sidebar's Upcoming entry opens the digest", async ({ page }) => {
    await createBoard(page)

    await page.getByRole("button", { name: "Upcoming" }).click()
    await page.waitForURL(/\/digest/)
    await expect(page.getByRole("button", { name: "Hide done" })).toBeVisible()
  })

  test("a digest row's board link opens that card's board", async ({
    page,
  }) => {
    const deckId = await createBoard(page)
    await renameBoard(page, "Untitled board", "Roadmap")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Due soon")

    await setDeadline(page, "Due soon", "Today")

    await page.goto("/digest")
    // Scoped to the row: the sidebar carries the board name too.
    const row = digestRow(page, "Due soon")
    await row.getByRole("button", { name: "Roadmap · To Do" }).click()

    await page.waitForURL(new RegExp(`/d/${deckId}`))
    await expect(page.getByRole("button", { name: "Add column" })).toBeVisible()
  })
})
