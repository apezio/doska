import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  column,
  columnCardTitles,
  createBoard,
  dragCardByTitle,
  retitleCard,
} from "../helpers"

/** The width a column has until someone drags it. */
const DEFAULT_WIDTH = 384

/** The column's rendered width, rounded — the number a user is looking at. */
async function columnWidth(page: Page, name: string): Promise<number> {
  const box = await column(page, name).boundingBox()
  if (!box) throw new Error(`column "${name}" has no layout box`)
  return Math.round(box.width)
}

function resizeHandle(page: Page, name: string) {
  return page.getByRole("separator", { name: `Resize ${name}` })
}

/** Drags the named column's right edge by `dx` px — positive widens it. */
async function dragEdge(page: Page, name: string, dx: number): Promise<void> {
  const box = await resizeHandle(page, name).boundingBox()
  if (!box) throw new Error(`resize handle for "${name}" has no layout box`)

  const x = box.x + box.width / 2
  const y = box.y + Math.min(box.height / 2, 200)
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y, { steps: 10 })
  await page.mouse.up()
}

test.describe("column resize", () => {
  test("dragging the edge widens the column and only that column", async ({
    page,
  }) => {
    await createBoard(page)
    expect(await columnWidth(page, "To Do")).toBe(DEFAULT_WIDTH)

    await dragEdge(page, "To Do", 120)

    await expect
      .poll(() => columnWidth(page, "To Do"))
      .toBe(DEFAULT_WIDTH + 120)
    // Its neighbours are untouched: each column keeps its own width.
    expect(await columnWidth(page, "In Progress")).toBe(DEFAULT_WIDTH)
  })

  test("the new width survives a reload", async ({ page }) => {
    await createBoard(page)
    await dragEdge(page, "To Do", 100)
    await expect
      .poll(() => columnWidth(page, "To Do"))
      .toBe(DEFAULT_WIDTH + 100)

    await page.reload()
    await expect(column(page, "To Do")).toBeVisible()
    await expect
      .poll(() => columnWidth(page, "To Do"))
      .toBe(DEFAULT_WIDTH + 100)
  })

  test("double-clicking the edge puts the column back to its default", async ({
    page,
  }) => {
    await createBoard(page)
    await dragEdge(page, "To Do", 150)
    await expect
      .poll(() => columnWidth(page, "To Do"))
      .toBe(DEFAULT_WIDTH + 150)

    await resizeHandle(page, "To Do").dblclick()
    await expect.poll(() => columnWidth(page, "To Do")).toBe(DEFAULT_WIDTH)
  })

  // The bounds are what keep a board usable: no column can be dragged down to a
  // sliver, and none can be dragged wide enough to hide the rest of the board.
  test("a column can be neither shrunk nor stretched past its limits", async ({
    page,
  }) => {
    await createBoard(page)

    await dragEdge(page, "To Do", -2000)
    await expect.poll(() => columnWidth(page, "To Do")).toBe(240)

    await dragEdge(page, "To Do", 4000)
    await expect.poll(() => columnWidth(page, "To Do")).toBe(720)
  })

  test("cards still drag between columns after a resize", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Roamer")

    await dragEdge(page, "To Do", 120)
    await expect
      .poll(() => columnWidth(page, "To Do"))
      .toBe(DEFAULT_WIDTH + 120)

    await dragCardByTitle(page, "Roamer", ["ArrowRight"])
    await expect.poll(() => columnCardTitles(page, "To Do")).toEqual([])
    await expect
      .poll(() => columnCardTitles(page, "In Progress"))
      .toContain("Roamer")
  })
})
