import { beforeEach, describe, expect, it, vi } from "vitest"
import { Vault } from "../src/vault"
import { FakeBoard, makeCard, makeColumn, MemoryFs } from "./fakes"

const ROOT = "/vault"
const TODO = makeColumn("col-todo", "To do")
const DONE = makeColumn("col-done", "Done")

describe("Vault", () => {
  let fs: MemoryFs
  let board: FakeBoard
  let vault: Vault
  let changes: number

  beforeEach(() => {
    fs = new MemoryFs()
    board = new FakeBoard([TODO, DONE])
    changes = 0
    vault = new Vault({
      fs,
      board,
      root: ROOT,
      onBoardChange: () => changes++,
    })
  })

  it("writes each card into its column's folder", async () => {
    const card = board.add(
      makeCard({ columnId: TODO.id, title: "Ship it", body: "soon" })
    )
    await vault.sync()

    const text = fs.files.get(`${ROOT}/to_do/ship_it.md`)
    expect(text).toContain(`id: ${card.id}`)
    expect(text).toContain("soon")
    expect(changes).toBe(0)
  })

  it("keeps two cards with one title in separate files", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(true)
    expect(fs.files.has(`${ROOT}/to_do/ship_it_2.md`)).toBe(true)
  })

  it("takes an edit made in the file back into the card", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    const path = `${ROOT}/to_do/ship_it.md`
    await fs.write(path, `${fs.files.get(path)!}edited in the editor\n`)
    await vault.sync()

    expect(board.cardsById.get(card.id)?.body).toBe("edited in the editor")
    expect(changes).toBe(1)
  })

  it("writes an edit made in the app back out to the file", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await board.updateCard(card.id, { title: "Shipped" })
    await vault.sync()

    expect(fs.files.get(`${ROOT}/to_do/ship_it.md`)).toContain("title: Shipped")
  })

  it("moves the card when its file is dragged to another folder", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await fs.rename(`${ROOT}/to_do/ship_it.md`, `${ROOT}/done/ship_it.md`)
    await vault.sync()

    expect(board.cardsById.get(card.id)?.columnId).toBe(DONE.id)
    expect(changes).toBe(1)
  })

  it("moves the file when the card is dragged to another column", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await board.moveCardToColumn(card.id, DONE.id)
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(false)
    expect(fs.files.has(`${ROOT}/done/ship_it.md`)).toBe(true)
  })

  it("makes a card out of a note dropped into a folder", async () => {
    await vault.sync()
    await fs.write(`${ROOT}/to_do/Idea.md`, "a thought\n")
    await vault.sync()

    const card = [...board.cardsById.values()][0]
    expect(card.title).toBe("Idea")
    expect(card.body).toBe("a thought")
    expect(card.columnId).toBe(TODO.id)
    expect(fs.files.get(`${ROOT}/to_do/Idea.md`)).toContain(`id: ${card.id}`)
  })

  it("trashes the file of a card deleted in the app", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    board.cardsById.delete(card.id)
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(false)
    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(true)
  })

  it("deletes the card whose file was dragged into .trash", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await fs.rename(`${ROOT}/to_do/ship_it.md`, `${ROOT}/_trash/ship_it.md`)
    await vault.sync()

    expect(board.deleted).toEqual([card.id])
    expect(changes).toBe(1)
  })

  it("lets the file win for edits made while the app was closed", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    const path = `${ROOT}/to_do/ship_it.md`
    const offline = `${fs.files.get(path)!}written while away\n`
    await fs.write(path, offline)

    // A fresh vault has no memory of what it wrote last run.
    await new Vault({ fs, board, root: ROOT }).sync()

    expect(board.cardsById.get(card.id)?.body).toBe("written while away")
  })

  it("keeps titles of any script readable in a filename", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Купить молоко" }))
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/купить_молоко.md`)).toBe(true)
  })

  it("keeps a trashed file's own name apart from one already there", async () => {
    const first = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    board.cardsById.delete(first.id)
    await vault.sync()

    const second = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    board.cardsById.delete(second.id)
    await vault.sync()

    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(true)
    expect(fs.files.has(`${ROOT}/_trash/ship_it_2.md`)).toBe(true)
  })

  it("syncs again when the watcher fires", async () => {
    const stop = await vault.watch()

    await fs.write(`${ROOT}/to_do/Idea.md`, "a thought\n")
    fs.touch()

    await vi.waitFor(() => expect(board.cardsById.size).toBe(1))
    stop()
  })
})
