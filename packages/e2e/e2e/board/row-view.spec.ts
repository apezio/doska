import { test, expect } from "@playwright/test"
import { addCard, createBoard, digestRow, retitleCard } from "../helpers"

test.describe("the board's row view", () => {
  test("the header toggle swaps the columns for date-grouped rows", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Nothing due")

    await page.getByRole("button", { name: "Show rows" }).click()

    // Undated cards close the list under their own heading.
    await expect(
      page.getByRole("heading", { name: "No deadline" })
    ).toBeVisible()
    const row = digestRow(page, "Nothing due")
    await expect(row).toBeVisible()
    // The row names the column the card is still in, without the board.
    await expect(row).toContainText("To Do")
    // The columns are gone, and with them the way to add one.
    await expect(page.getByRole("button", { name: "Add column" })).toHaveCount(
      0
    )

    await page.getByRole("button", { name: "Show columns" }).click()
    await expect(page.getByRole("button", { name: "Add column" })).toBeVisible()
  })

  test("the chosen view is remembered for that board alone", async ({
    page,
  }) => {
    const first = await createBoard(page)
    await page.getByRole("button", { name: "Show rows" }).click()
    await expect(
      page.getByRole("button", { name: "Show columns" })
    ).toBeVisible()

    // A second board opens in columns: the preference is per board.
    const second = await createBoard(page)
    expect(second).not.toBe(first)
    await expect(page.getByRole("button", { name: "Show rows" })).toBeVisible()

    // And it is this device's, so a reload keeps it rather than a sync.
    await page.goto(`/d/${first}`)
    await page.reload()
    await expect(
      page.getByRole("button", { name: "Show columns" })
    ).toBeVisible()
  })

  test("a card added from the header lands in the first column and opens", async ({
    page,
  }) => {
    await createBoard(page)
    await page.getByRole("button", { name: "Show rows" }).click()

    await page.getByRole("button", { name: "Add card" }).click()

    await page.waitForURL(/\/c\//)
    await page.goBack()
    await expect(digestRow(page, "Untitled card")).toContainText("To Do")
  })
})
