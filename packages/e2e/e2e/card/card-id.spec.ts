import { test, expect, type Page } from "@playwright/test"
import { addCard, cardDisplayId, createBoard, signIn } from "../helpers"

/** The card's "⋯" menu, which is where "Copy id" lives. */
function openCardMenu(page: Page) {
  return page.getByRole("button", { name: "Card actions" }).first().click()
}

// The id is only stamped by the server on sync, so these need a signed-in board.
test.describe("card id", () => {
  // Playwright only recognises the clipboard permissions in chromium — firefox
  // and webkit reject `clipboard-read` at context creation.
  test.describe("clipboard contents", () => {
    test.skip(
      ({ browserName }) => browserName !== "chromium",
      "clipboard permissions are chromium-only"
    )
    test.use({ permissions: ["clipboard-read", "clipboard-write"] })

    test("copies the card id to the clipboard", async ({ page }) => {
      await signIn(page)
      await createBoard(page)
      await addCard(page, "To Do")

      const id = await cardDisplayId(page, "Untitled card")
      expect(id).toMatch(/^\d+$/)

      await openCardMenu(page)
      await page.getByRole("menuitem", { name: "Copy id" }).click()

      // navigator.clipboard is on the real page, not Node's ambient Navigator type.
      const clipboard = await page.evaluate(() =>
        (
          navigator as Navigator & {
            clipboard: { readText(): Promise<string> }
          }
        ).clipboard.readText()
      )
      expect(clipboard).toBe(id)
    })
  })

  test("a card with no number yet offers nothing to copy", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await openCardMenu(page)
    await expect(page.getByRole("menuitem", { name: "Copy id" })).toHaveCount(0)
  })
})
