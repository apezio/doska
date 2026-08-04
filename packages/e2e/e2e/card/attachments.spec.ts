import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  createBoard,
  editCardBody,
  mockFileRoutes,
  PNG,
  signIn,
} from "../helpers"

async function attachFile(page: Page, name: string): Promise<void> {
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name, mimeType: "image/png", buffer: PNG })
  await expect(
    page.getByRole("button", { name: "Attach", exact: true })
  ).toBeVisible()
}

test.describe("card attachments", () => {
  test("Attach is disabled until signed in", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await expect(
      cardPanel(page).getByRole("button", { name: "Attach", exact: true })
    ).toBeDisabled()
  })

  test("uploading a file renders its row and tile", async ({ page }) => {
    await signIn(page)
    await mockFileRoutes(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await attachFile(page, "diagram.png")

    await expect(cardPanel(page).getByText("diagram")).toBeVisible()
    await expect(
      cardPanel(page).getByRole("button", { name: "diagram.png" })
    ).toBeVisible()
  })

  test("clicking an image attachment in readonly view opens the viewer", async ({
    page,
  }) => {
    await signIn(page)
    await mockFileRoutes(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await editCardBody(page, "Untitled card", "Some notes")

    // Body is non-empty, so the panel opens in preview (readonly) this time.
    await card(page, "Some notes").click()
    await expect(cardPanel(page)).toBeVisible()

    await attachFile(page, "photo.png")
    await expect(cardPanel(page).getByText("photo")).toBeVisible()

    await cardPanel(page).getByText("photo").click()

    const viewer = page.getByRole("dialog")
    await expect(viewer.getByRole("img", { name: "photo.png" })).toBeVisible()
    await viewer.getByRole("button", { name: "Close" }).click()
    await expect(viewer).toHaveCount(0)
  })

  test("removing an attachment removes its row", async ({ page }) => {
    await signIn(page)
    await mockFileRoutes(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    await attachFile(page, "notes.png")
    await expect(cardPanel(page).getByText("notes")).toBeVisible()

    await page.getByRole("button", { name: "Remove attachment" }).click()
    await expect(cardPanel(page).getByText("notes")).toHaveCount(0)
  })
})
