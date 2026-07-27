import { test, expect } from "@playwright/test"
import {
  columnColorSwatch,
  createBoard,
  setColumnColor,
  signIn,
} from "../helpers"

test.describe("column color", () => {
  test("sets a color from the column header and keeps it across a reload", async ({
    page,
  }) => {
    await signIn(page)
    await createBoard(page)

    await expect(columnColorSwatch(page, "To Do")).toHaveAccessibleName(
      "Column color: No color"
    )

    await setColumnColor(page, "To Do", "Violet")

    await page.reload()
    await expect(columnColorSwatch(page, "To Do")).toHaveAccessibleName(
      "Column color: Violet"
    )
  })

  test("colors are per column", async ({ page }) => {
    await signIn(page)
    await createBoard(page)

    await setColumnColor(page, "To Do", "Violet")

    await expect(columnColorSwatch(page, "In Progress")).toHaveAccessibleName(
      "Column color: No color"
    )
  })

  test("a color can be cleared again", async ({ page }) => {
    await signIn(page)
    await createBoard(page)

    await setColumnColor(page, "To Do", "Violet")
    await setColumnColor(page, "To Do", "No color")

    await expect(columnColorSwatch(page, "To Do")).toHaveAccessibleName(
      "Column color: No color"
    )
  })
})
