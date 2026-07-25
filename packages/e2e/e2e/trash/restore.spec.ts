import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardTitled,
  column,
  columnCardTitles,
  createBoard,
  deleteBoard,
  deleteColumn,
  openBoardInSidebar,
  openTrash,
  renameBoard,
  renameColumn,
  restoreFromTrash,
  retitleCard,
  signIn,
  trashEntry,
} from "../helpers"

/**
 * The trash spans the whole account and the e2e server is shared, so a retry
 * would see the previous attempt's tombstone under the same name. Every title
 * a test looks up in the trash gets a run-unique suffix.
 */
const uniq = (name: string) => `${name} ${crypto.randomUUID().slice(0, 8)}`

/** Deletes the card titled `title` through its action menu. */
async function deleteCard(page: Page, title: string) {
  await cardTitled(page, title)
    .getByRole("button", { name: "Card actions" })
    .click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await expect(cardTitled(page, title)).toHaveCount(0)
}

test.describe("trash", () => {
  test("a deleted card can be restored from the trash", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    const title = uniq("Doomed card")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", title)

    await deleteCard(page, title)

    await openTrash(page)
    await expect(trashEntry(page, title)).toBeVisible()
    await restoreFromTrash(page, title)

    await page.goBack()
    await expect(card(page, title)).toBeVisible()
  })

  test("⌘Z takes back the last delete", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Undo me")

    await deleteCard(page, "Undo me")
    await page.keyboard.press("ControlOrMeta+z")

    await expect(card(page, "Undo me")).toBeVisible()
  })

  test("restoring a column brings its cards back with it", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    const columnName = uniq("Doomed column")
    const cardTitle = uniq("Passenger")
    await renameColumn(page, "To Do", columnName)
    await addCard(page, columnName)
    await retitleCard(page, "Untitled card", cardTitle)

    await deleteColumn(page, columnName)

    await openTrash(page)
    // One entry for the deletion, not one per record it swept up.
    await expect(trashEntry(page, cardTitle)).toHaveCount(0)
    await expect(trashEntry(page, columnName)).toContainText("1 card")

    await restoreFromTrash(page, columnName)

    await page.goBack()
    await expect(column(page, columnName)).toBeVisible()
    expect(await columnCardTitles(page, columnName)).toEqual([cardTitle])
  })

  test("a deleted board comes back with its columns", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    const name = uniq("Doomed board")
    await renameBoard(page, "Untitled board", name)
    await deleteBoard(page)

    await openTrash(page)
    await restoreFromTrash(page, name)

    await openBoardInSidebar(page, name)
    expect(await page.getByRole("group").count()).toBe(3)
  })
})
