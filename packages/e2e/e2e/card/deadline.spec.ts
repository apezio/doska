import { test, expect, type Page } from "@playwright/test"
import { addCard, card, createBoard } from "../helpers"

// The overlay input has no accessible name, so it's reached by its type attribute.
function deadlineInput(page: Page) {
  return card(page, "Untitled card").locator('input[type="date"]')
}

// Anything within 3 days reads as a relative label instead of a date, so an
// "upcoming" date has to be computed from today rather than hardcoded.
const UPCOMING = upcomingDate()

function upcomingDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return { iso: `${year}-${month}-${day}`, formatted: `${day}.${month}.${year}` }
}

// DateInput only renders the native input below the 768px breakpoint; above it the calendar popover is harder to drive.
test.describe("card deadline", () => {
  test.use({ viewport: { width: 500, height: 800 } })

  test("setting a future deadline shows the upcoming date", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await deadlineInput(page).fill(UPCOMING.iso)

    await expect(card(page, "Untitled card").getByText(UPCOMING.formatted)).toBeVisible()
  })

  test("an overdue deadline is colour-coded distinctly from an upcoming one", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await deadlineInput(page).fill("2020-01-01")

    // An overdue deadline reads as the relative label ("overdue"), not the date.
    const overdueChip = card(page, "Untitled card").getByText("overdue")
    await expect(overdueChip).toBeVisible()
    await expect(overdueChip).toHaveClass(/text-destructive/)

    await deadlineInput(page).fill(UPCOMING.iso)
    const upcomingChip = card(page, "Untitled card").getByText(UPCOMING.formatted)
    await expect(upcomingChip).not.toHaveClass(/text-destructive/)
  })

  test("a deadline persists across reload", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await deadlineInput(page).fill(UPCOMING.iso)
    await expect(card(page, "Untitled card").getByText(UPCOMING.formatted)).toBeVisible()

    await page.reload()
    await expect(card(page, "Untitled card").getByText(UPCOMING.formatted)).toBeVisible()
  })
})
