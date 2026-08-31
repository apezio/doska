import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardDisplayId,
  cardPanel,
  closeCard,
  createBoard,
  editCardBody,
  openCard,
  pasteInto,
  pngDataTransfer,
  retitleCard,
  signIn,
} from "../helpers"

/**
 * The card editor's own undo history. Everything here is typed and clicked the
 * way a user would, and every assertion reads the markdown the user sees in the
 * Notes field. Type with `pressSequentially`, not `fill`: the history groups on
 * what was typed, and the menus are driven by the textarea's own input events.
 *
 * Steps are grouped on meaningful boundaries — a word, a line, a caret jump, a
 * command — never on a timer, so nothing here has to race a clock.
 */
async function openNotes(page: Page) {
  await createBoard(page)
  await addCard(page, "To Do")
  await card(page, "Untitled card").click()
  const notes = page.getByPlaceholder("Notes")
  await notes.click()
  return notes
}

// Typechecked here but run in the page, where these exist; Node has no DOM lib.
// Type-only, so nothing is emitted.
declare const InputEvent: {
  new (
    type: string,
    init: { inputType: string; bubbles: boolean; cancelable: boolean }
  ): Event
}
declare const document: { execCommand(command: string): boolean }

const UNDO = "ControlOrMeta+z"
const REDO = "ControlOrMeta+Shift+z"

test.describe("editor undo: typing", () => {
  test("undo takes back a whole word, not one keystroke", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("hello")
    await notes.press(UNDO)

    await expect(notes).toHaveValue("")
  })

  test("undo walks back word by word and redo walks forward", async ({
    page,
  }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("hello world")

    // The space is absorbed into the word it follows, so "world" goes first.
    await notes.press(UNDO)
    await expect(notes).toHaveValue("hello ")
    await notes.press(UNDO)
    await expect(notes).toHaveValue("")

    await notes.press(REDO)
    await expect(notes).toHaveValue("hello ")
    await notes.press(REDO)
    await expect(notes).toHaveValue("hello world")
  })

  test("a newline is a step of its own", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("one")
    await notes.press("Enter")
    await notes.pressSequentially("two")

    await notes.press(UNDO)
    await expect(notes).toHaveValue("one\n")
    await notes.press(UNDO)
    await expect(notes).toHaveValue("one")
    await notes.press(UNDO)
    await expect(notes).toHaveValue("")
  })

  test("the caret comes back with the text", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("hello world")
    await notes.press(UNDO)
    await expect(notes).toHaveValue("hello ")

    // Typing continues from where the caret was left, not from the start.
    await notes.pressSequentially("there")
    await expect(notes).toHaveValue("hello there")
  })

  test("editing after an undo drops the redo branch", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("hello world")
    await notes.press(UNDO)
    await notes.pressSequentially("there")
    await expect(notes).toHaveValue("hello there")

    await notes.press(REDO)
    await expect(notes).toHaveValue("hello there")
  })
})

test.describe("editor undo: the app's own edits", () => {
  test("a slash command insert is one step", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("/task")
    await page.getByRole("button", { name: /^To-do/ }).click()
    await expect(notes).toHaveValue("- [ ] ")

    await notes.press(UNDO)
    await expect(notes).toHaveValue("/task")

    await notes.press(REDO)
    await expect(notes).toHaveValue("- [ ] ")
  })

  test("an insert puts the caret back where the snippet meant it", async ({
    page,
  }) => {
    const notes = await openNotes(page)

    // The link snippet lands the caret between the brackets, not at the end.
    await notes.pressSequentially("/link")
    await page.getByRole("button", { name: /^Link/ }).click()
    await expect(notes).toHaveValue("[](url)")

    await notes.pressSequentially("here")
    await expect(notes).toHaveValue("[here](url)")

    await notes.press(UNDO)
    await expect(notes).toHaveValue("[](url)")

    // Back between the brackets, which is only true if the caret the insert
    // asked for was the one recorded.
    await notes.pressSequentially("X")
    await expect(notes).toHaveValue("[X](url)")
  })

  test("list continuation is one step", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("- milk")
    await notes.press("Enter")
    await expect(notes).toHaveValue("- milk\n- ")

    await notes.press(UNDO)
    await expect(notes).toHaveValue("- milk")
  })

  test("a cut line comes back whole", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("one")
    await notes.press("Enter")
    await notes.pressSequentially("two")
    await notes.press("ControlOrMeta+x")
    await expect(notes).toHaveValue("one")

    await notes.press(UNDO)
    await expect(notes).toHaveValue("one\ntwo")
  })

  test("undo closes a slash menu left standing", async ({ page }) => {
    const notes = await openNotes(page)

    await notes.pressSequentially("abc /li")
    const item = page.getByRole("button", { name: /^Link/ })
    await expect(item).toBeVisible()

    await notes.press(UNDO)

    await expect(notes).toHaveValue("abc ")
    // The menu re-reads the trigger off the new value and finds none.
    await expect(item).toHaveCount(0)

    await notes.pressSequentially("ok")
    await expect(notes).toHaveValue("abc ok")
  })

  test("a task ticked in preview undoes back in the editor", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Checklist")
    await editCardBody(page, "Checklist", "- [ ] First\n- [ ] Second")

    // A card with a body opens read-only, which is where the boxes are tickable.
    await card(page, "Checklist").click()
    await cardPanel(page).getByRole("checkbox").first().click()
    await expect(card(page, "Checklist")).toContainText("1/2")

    await page.getByRole("button", { name: "Edit" }).click()
    const notes = page.getByPlaceholder("Notes")
    await notes.click()
    await expect(notes).toHaveValue("- [x] First\n- [ ] Second")

    // The stack outlives the switch between preview and editor.
    await notes.press(UNDO)
    await expect(notes).toHaveValue("- [ ] First\n- [ ] Second")
  })
})

test.describe("editor undo: scope", () => {
  test("title and body share one stack, newest first", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    const title = page.getByPlaceholder("Title")
    const notes = page.getByPlaceholder("Notes")

    await title.click()
    await title.pressSequentially("Plan")
    await notes.click()
    await notes.pressSequentially("draft")

    await notes.press(UNDO)
    await expect(notes).toHaveValue("")
    await expect(title).toHaveValue("Plan")

    // The stack is one, so the next step back is the title's — and the caret
    // follows it there.
    await notes.press(UNDO)
    await expect(title).toHaveValue("")
    await expect(title).toBeFocused()
  })

  test("each card gets its own history", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "First")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Second")

    await openCard(page, "First")
    const first = page.getByPlaceholder("Notes")
    await first.click()
    await first.pressSequentially("alpha")
    await closeCard(page)

    await openCard(page, "Second")
    const second = page.getByPlaceholder("Notes")
    await second.click()
    await second.pressSequentially("beta")

    await second.press(UNDO)
    await expect(second).toHaveValue("")
    // Nothing of the other card's session is reachable from here.
    await second.press(UNDO)
    await expect(second).toHaveValue("")
    await closeCard(page)

    await openCard(page, "First")
    await expect(page.getByPlaceholder("Notes")).toHaveValue("alpha")
  })

  test("a native undo offered through beforeinput is refused", async ({
    page,
  }) => {
    const notes = await openNotes(page)
    await notes.pressSequentially("keep this")

    // The Edit and context menus, and iOS shake-to-undo, reach the native stack
    // without a keystroke the editor could intercept, so the refusal has to sit
    // on the input itself.
    const blocked = await notes.evaluate(
      (el) =>
        !el.dispatchEvent(
          new InputEvent("beforeinput", {
            inputType: "historyUndo",
            bubbles: true,
            cancelable: true,
          })
        )
    )

    expect(blocked).toBe(true)
    await expect(notes).toHaveValue("keep this")
  })

  // Chromium's legacy editing command goes around `beforeinput` and cannot be
  // refused at all. What matters is that it stays harmless, which is browser
  // behaviour worth pinning where it actually happens.
  test.describe("the legacy editing command", () => {
    test.skip(
      ({ browserName }) => browserName !== "chromium",
      "execCommand undo is a chromium path"
    )

    test("cannot leave the editor out of step with itself", async ({
      page,
    }) => {
      const notes = await openNotes(page)
      await notes.pressSequentially("keep this")

      await notes.evaluate(() => document.execCommand("undo"))
      // It got through, and took a character with it.
      await expect(notes).toHaveValue("keep thi")

      // But it arrived like any other edit, so the editor's own undo takes it
      // straight back. Nothing is lost and the two never diverge.
      await notes.press(UNDO)
      await expect(notes).toHaveValue("keep this")
    })
  })

  test.describe("IME composition", () => {
    test.skip(
      ({ browserName }) => browserName !== "chromium",
      "composing through CDP is a chromium path"
    )

    test("a whole composition is one step", async ({ page }) => {
      const notes = await openNotes(page)
      await notes.pressSequentially("hi ")

      // Compose and commit the way an IME does, rather than dispatching the
      // composition events by hand.
      const cdp = await page.context().newCDPSession(page)
      await cdp.send("Input.imeSetComposition", {
        text: "に",
        selectionStart: 1,
        selectionEnd: 1,
      })
      await cdp.send("Input.imeSetComposition", {
        text: "にほん",
        selectionStart: 3,
        selectionEnd: 3,
      })
      await cdp.send("Input.insertText", { text: "日本" })
      await expect(notes).toHaveValue("hi 日本")

      // The states the IME passed through on the way are not steps of their own.
      await notes.press(UNDO)
      await expect(notes).toHaveValue("hi ")
    })
  })
})

test.describe("editor undo: the visible controls", () => {
  const undoButton = (page: Page) =>
    cardPanel(page).getByRole("button", { name: "Undo", exact: true })
  const redoButton = (page: Page) =>
    cardPanel(page).getByRole("button", { name: "Redo", exact: true })

  test("both are dead until there is something to undo", async ({ page }) => {
    await openNotes(page)

    await expect(undoButton(page)).toBeDisabled()
    await expect(redoButton(page)).toBeDisabled()
  })

  test("they drive the same stack as the shortcuts", async ({ page }) => {
    const notes = await openNotes(page)
    await notes.pressSequentially("hello world")

    await expect(redoButton(page)).toBeDisabled()
    await undoButton(page).click()
    await expect(notes).toHaveValue("hello ")

    await expect(redoButton(page)).toBeEnabled()
    await redoButton(page).click()
    await expect(notes).toHaveValue("hello world")

    // The keyboard picks up where the pointer left off.
    await notes.press(UNDO)
    await expect(notes).toHaveValue("hello ")
  })

  test("undo reaches an edit made in the preview, where ⌘Z cannot", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Checklist")
    await editCardBody(page, "Checklist", "- [ ] First\n- [ ] Second")

    await card(page, "Checklist").click()
    await cardPanel(page).getByRole("checkbox").first().click()
    await expect(card(page, "Checklist")).toContainText("1/2")

    // No textarea is mounted here, so the button is the only way back.
    await undoButton(page).click()
    await expect(card(page, "Checklist")).toContainText("0/2")
  })

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 780 } })

    test("undo moves into the card menu, where there is room", async ({
      page,
    }) => {
      const notes = await openNotes(page)
      await notes.pressSequentially("hello world")

      // The header is already clipping the card's meta at this width.
      await expect(undoButton(page)).toHaveCount(0)

      await cardPanel(page)
        .getByRole("button", { name: "Card actions" })
        .click()
      await page.getByRole("menuitem", { name: "Undo" }).click()

      await expect(notes).toHaveValue("hello ")
    })
  })
})

test.describe("editor undo: against a synced board", () => {
  test("a wikilink insert is one step", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Target card")
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Source card")
    const targetId = await cardDisplayId(page, "Target card")

    await openCard(page, "Source card")
    const notes = page.getByPlaceholder("Notes")
    await notes.click()
    await notes.pressSequentially("see [[Target")

    await page.getByRole("button", { name: `Target card #${targetId}` }).click()
    await expect(notes).toHaveValue(`see [[${targetId}|Target card]]`)

    await notes.press(UNDO)
    await expect(notes).toHaveValue("see [[Target")
  })

  test("a pasted attachment's markdown is one step", async ({ page }) => {
    await signIn(page)
    await createBoard(page)
    await addCard(page, "To Do")
    await card(page, "Untitled card").click()

    const notes = page.getByPlaceholder("Notes")
    await notes.click()
    await notes.pressSequentially("shot: ")

    await pasteInto(notes, await pngDataTransfer(page, "pasted.png"))
    await expect(notes).toHaveValue(/!\[pasted\.png\]\(attachment:/)

    await notes.press(UNDO)
    await expect(notes).toHaveValue("shot: ")
  })
})
