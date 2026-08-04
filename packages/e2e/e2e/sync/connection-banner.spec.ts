import { test, expect } from "@playwright/test"
import { createBoard, signIn, syncIndicator } from "../helpers"

/**
 * The app-wide "sync is down" notice, mounted outside the board so a dropped
 * connection is visible even where the board's sync pill isn't.
 */
test.describe("connection banner", () => {
  const banner = (page: import("@playwright/test").Page) =>
    page.getByRole("status").filter({ hasText: "Not syncing" })

  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced")
  })

  test("appears when the connection drops and clears on recovery", async ({
    page,
  }) => {
    await page.context().setOffline(true)
    await expect(banner(page)).toBeVisible({ timeout: 15_000 })
    await expect(
      banner(page).getByText("Data is saved on this device.")
    ).toBeVisible()
    await expect(
      banner(page).getByRole("button", { name: "Retry" })
    ).toBeVisible()

    await page.context().setOffline(false)
    await expect(banner(page)).toHaveCount(0, { timeout: 15_000 })
  })

  test("can be dismissed, and returns on the next drop", async ({ page }) => {
    await page.context().setOffline(true)
    await expect(banner(page)).toBeVisible({ timeout: 15_000 })

    await banner(page).getByRole("button", { name: "Dismiss" }).click()
    await expect(banner(page)).toHaveCount(0)

    // Still offline, but dismissed — the notice stays down for this drop.
    await expect(syncIndicator(page)).toHaveAccessibleName("Offline")
    await expect(banner(page)).toHaveCount(0)

    // A fresh drop is a fresh notice.
    await page.context().setOffline(false)
    await expect(syncIndicator(page)).toHaveAccessibleName("Synced", {
      timeout: 15_000,
    })
    await page.context().setOffline(true)
    await expect(banner(page)).toBeVisible({ timeout: 15_000 })
  })

  test("shows on Home, where there is no sync pill to fall back on", async ({
    page,
  }) => {
    // The case the banner exists for. Going offline the moment Home loads
    // catches the session check mid-flight — an unreachable server must not
    // read as signed out, which would quietly drop the app to local-only and
    // take the notice with it.
    await page.goto("/")
    await page.context().setOffline(true)

    await expect(banner(page)).toBeVisible({ timeout: 15_000 })
    // Still signed in, too: the sidebar keeps the account it knows.
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible()
  })
})
