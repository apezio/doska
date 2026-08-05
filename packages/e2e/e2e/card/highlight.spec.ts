import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  cardPanel,
  createBoard,
  openCard,
  retitleCard,
} from "../helpers"

/**
 * While editing, the body's markup is painted by a `pre` sitting behind the
 * textarea, which renders its own text transparent. The overlay is decorative,
 * so it has no accessible name to find it by.
 */
function highlightOverlay(page: Page) {
  return cardPanel(page).locator('pre[aria-hidden="true"]')
}

async function cardWithNotes(page: Page, body: string) {
  await createBoard(page)
  await addCard(page, "To Do")
  await retitleCard(page, "Untitled card", "Highlighted")
  await openCard(page, "Highlighted")

  const notes = page.getByPlaceholder("Notes")
  await notes.fill(body)
  return notes
}

const BODY = `# A heading with **bold**

Plain text, *emphasis* and \`code\`.

- [x] a ticked task
- [ ] an open one

> quoted

\`\`\`ts
const a = 1
\`\`\``

test.describe("editor syntax highlighting", () => {
  test("paints exactly the text the textarea holds", async ({ page }) => {
    await cardWithNotes(page, BODY)

    // The invariant the whole technique rests on: a character the overlay adds
    // or drops shifts every glyph after it out from under the caret. Read
    // through `textContent` rather than `toHaveText`, which collapses the
    // whitespace this comparison is about.
    const painted = await highlightOverlay(page).evaluate(
      (element) => element.textContent
    )
    expect(painted).toBe(BODY)
  })

  test("hides the textarea's own text so the overlay is what's read", async ({
    page,
  }) => {
    const notes = await cardWithNotes(page, "# Title")

    const color = await notes.evaluate(
      (element) =>
        element.ownerDocument.defaultView!.getComputedStyle(element).color
    )
    expect(color).toBe("rgba(0, 0, 0, 0)")

    // The caret still has to be visible, or there is nothing to type against.
    const caret = await notes.evaluate(
      (element) =>
        element.ownerDocument.defaultView!.getComputedStyle(element).caretColor
    )
    expect(caret).not.toBe(color)
  })

  test("styles the markup in its own runs, leaving the text one flow", async ({
    page,
  }) => {
    await cardWithNotes(page, "# Title with **bold**")

    const overlay = highlightOverlay(page)
    // The delimiters are painted apart from what they mark up.
    await expect(overlay.locator("span", { hasText: /^\*\*$/ })).toHaveCount(2)
    await expect(overlay.locator("span", { hasText: /^bold$/ })).toHaveCount(1)
  })

  test("leaves the title field unstyled, so only the body carries an overlay", async ({
    page,
  }) => {
    await cardWithNotes(page, "# Title")

    // The title renders larger than the body; an overlay there could not keep
    // the same metrics, so it deliberately has none.
    await expect(highlightOverlay(page)).toHaveCount(1)
  })
})
