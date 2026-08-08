import { test, expect, type Page } from "@playwright/test"
import { createBoard, signIn, signOut } from "../helpers"

/**
 * The device holds one account's data at a time. Signing in as someone else
 * replaces what is on it, and the sign-in form says so first — the boards you
 * made before signing in belong to whoever signs in first.
 */

function uniqueLogin(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

const WARNING = /will become part of the account you sign in with/

/** Opens the sign-in dialog without submitting it. */
async function openSignIn(page: Page): Promise<void> {
  await page.goto("/")
  await page
    .getByRole("button", { name: "Sign in to sync", exact: true })
    .click()
  await expect(page.getByPlaceholder("Login")).toBeVisible()
}

test.describe("switching accounts on one device", () => {
  test("the sign-in form warns about boards made before signing in", async ({
    page,
  }) => {
    // The untouched welcome board is not work anyone made, so nothing to warn
    // about until there is a real board.
    await openSignIn(page)
    await expect(page.getByText(WARNING)).toHaveCount(0)
    await page.getByRole("button", { name: "Cancel" }).click()

    await createBoard(page)

    await openSignIn(page)
    await expect(page.getByText(WARNING)).toBeVisible()
  })

  test("the warning is gone once an account owns the device", async ({
    page,
  }) => {
    await createBoard(page)
    await signIn(page)
    await signOut(page)

    // The board belongs to that account now; signing back in claims nothing new.
    await openSignIn(page)
    await expect(page.getByText(WARNING)).toHaveCount(0)
  })

  test("signing in as a second account leaves none of the first's boards", async ({
    page,
  }) => {
    const second = { login: uniqueLogin("switch"), password: "created-pass" }

    await signIn(page)
    await page.getByRole("button", { name: "Accounts" }).click()
    await page.getByPlaceholder("Login").fill(second.login)
    await page.getByPlaceholder("Password").fill(second.password)
    await page.getByRole("button", { name: "Add", exact: true }).click()
    await page.keyboard.press("Escape")

    await createBoard(page)
    const title = await page.getByRole("button", { name: /Untitled/ }).count()
    expect(title).toBeGreaterThan(0)

    await signOut(page)
    await signIn(page, second)

    await page.goto("/")
    await expect(page.getByRole("button", { name: /Untitled/ })).toHaveCount(0)
  })
})
