import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  columnDoneBadge,
  createBoard,
  retitleCard,
  setColumnDone,
} from "../helpers"

/** The native date input only renders below the 768px breakpoint. */
function deadlineInput(page: Page, title: string) {
  return page
    .locator("[data-rfd-draggable-id]", { hasText: title })
    .locator('input[type="date"]')
}

/** Local `YYYY-MM-DD` for today — the reference the digest ranges against. */
function todayIso(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${String(d.getDate()).padStart(2, "0")}`
}

test.describe("marking a column done", () => {
  test("badges the column and persists across reload", async ({ page }) => {
    await createBoard(page)

    await expect(columnDoneBadge(page, "Done")).toHaveCount(0)

    await setColumnDone(page, "Done", true)

    await page.reload()
    await expect(columnDoneBadge(page, "Done")).toBeVisible()
  })

  test("un-marking a done column clears the flag", async ({ page }) => {
    await createBoard(page)
    await setColumnDone(page, "Done", true)
    await setColumnDone(page, "Done", false)

    await page.reload()
    await expect(columnDoneBadge(page, "Done")).toHaveCount(0)
  })

  test("marking a second column done clears the first", async ({ page }) => {
    await createBoard(page)
    await setColumnDone(page, "Done", true)
    await setColumnDone(page, "In Progress", true)

    await expect(columnDoneBadge(page, "Done")).toHaveCount(0)

    await page.reload()
    await expect(columnDoneBadge(page, "In Progress")).toBeVisible()
    await expect(columnDoneBadge(page, "Done")).toHaveCount(0)
  })

  test("a card in a done column reads as done in the digest", async ({
    page,
  }) => {
    const deckId = await createBoard(page)
    await addCard(page, "In Progress")
    await retitleCard(page, "Untitled card", "Wrapped up")

    // The native date input only renders below the 768px breakpoint.
    await page.setViewportSize({ width: 500, height: 900 })
    await deadlineInput(page, "Wrapped up").fill(todayIso())

    // Undone column first: the digest row carries no strikethrough.
    await page.goto("/digest")
    let row = page.getByRole("button", { name: /Wrapped up/ })
    await expect(row).toBeVisible()
    await expect(row.locator(".line-through")).toHaveCount(0)

    // Mark the column done and the same row now renders struck through.
    await page.goto(`/d/${deckId}`)
    await setColumnDone(page, "In Progress", true)

    await page.goto("/digest")
    row = page.getByRole("button", { name: /Wrapped up/ })
    await expect(row.locator(".line-through")).toHaveText("Wrapped up")
  })

  test("the digest names a done column when the board has none", async ({
    page,
  }) => {
    const deckId = await createBoard(page)
    await addCard(page, "In Progress")
    await retitleCard(page, "Untitled card", "Needs a done column")

    await page.setViewportSize({ width: 500, height: 900 })
    await deadlineInput(page, "Needs a done column").fill(todayIso())

    // No done column yet, so the row's tick box explains itself instead. The
    // seeded Welcome board has none either, hence the scoping to this row.
    await page.goto("/digest")
    const row = page.getByRole("button", { name: /Needs a done column/ })
    const help = row.getByRole("checkbox", {
      name: "How marking cards done works",
    })
    await expect(help).not.toBeChecked()
    await help.click()

    // The modal hides the rest of the page from the a11y tree, so the row is
    // only reachable again once a column is picked and the dialog closes.
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: "Done", exact: true }).click()

    // Picking one turns the same box into a working checkbox.
    const checkbox = row.getByRole("checkbox", { name: "Toggle done" })
    await expect(checkbox).toBeVisible()
    await checkbox.click()
    await expect(row.locator(".line-through")).toHaveText("Needs a done column")

    // The flag is the board's, not the digest's: it shows up on the column too.
    await page.goto(`/d/${deckId}`)
    await expect(columnDoneBadge(page, "Done")).toBeVisible()
  })
})
