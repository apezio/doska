import { test, expect, type Page } from "@playwright/test"
import { addCard, card, createBoard } from "../helpers"

/**
 * IDE-style cut: ⌘X with nothing selected takes the whole line the caret is on,
 * clipboard included. With a selection the browser's own cut is left to run.
 */
async function openNotesWith(page: Page, lines: string[]) {
  await createBoard(page)
  await addCard(page, "To Do")
  await card(page, "Untitled card").click()
  const notes = page.getByPlaceholder("Notes")
  await notes.click()
  for (const [i, line] of lines.entries()) {
    if (i > 0) await notes.press("Enter")
    await notes.pressSequentially(line)
  }
  await expect(notes).toHaveValue(lines.join("\n"))
  return notes
}

test.describe("cut line", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] })

  test("cuts the line the caret sits on, without a dangling blank", async ({
    page,
  }) => {
    const notes = await openNotesWith(page, ["one", "two", "three"])

    // Caret is at the end of the last line.
    await notes.press("ControlOrMeta+x")

    await expect(notes).toHaveValue("one\ntwo")
  })

  test("cuts a middle line and closes the gap", async ({ page }) => {
    const notes = await openNotesWith(page, ["one", "two", "three"])

    await notes.press("ArrowUp")
    await notes.press("ControlOrMeta+x")

    await expect(notes).toHaveValue("one\nthree")
  })

  test("the cut line lands on the clipboard as a whole line", async ({
    page,
  }) => {
    const notes = await openNotesWith(page, ["one", "two", "three"])

    await notes.press("ArrowUp")
    await notes.press("ControlOrMeta+x")

    // navigator.clipboard is on the real page, not Node's ambient Navigator type.
    const clipboard = await page.evaluate(() =>
      (
        navigator as Navigator & { clipboard: { readText(): Promise<string> } }
      ).clipboard.readText()
    )
    expect(clipboard).toBe("two\n")
  })

  test("a selection cuts only what's selected", async ({ page }) => {
    const notes = await openNotesWith(page, ["one", "two three"])

    // Select " three" only — the native cut should take just that, not the line.
    for (let i = 0; i < " three".length; i++)
      await notes.press("Shift+ArrowLeft")
    await notes.press("ControlOrMeta+x")

    await expect(notes).toHaveValue("one\ntwo")
  })
})
