import type { Card, Column } from "@doska/contract"
import { CardFile } from "./card-file"
import { claim, ColumnFolder, type VaultFs } from "./column-folder"
import { snakeName } from "./utils"
import type { Written } from "./written"

/** `_trash`, `_files` and anything hidden: not a column's folder. */
const OWNED = /^[._]/

/** A column and the folder it lives in, once the two agree on a name. */
export interface Resolved {
  folders: ColumnFolder[]
  /** The columns the board has to rename, because their folders were. */
  retitled: Map<string, string>
}

/**
 * The columns as folders, following a rename on either side.
 */
export class Folders {
  private readonly fs: VaultFs
  private readonly root: string
  private readonly written: Written

  constructor(fs: VaultFs, root: string, written: Written) {
    this.fs = fs
    this.root = root
    this.written = written
  }

  async resolve(columns: Column[], cards: Card[]): Promise<Resolved> {
    const { chosen, taken } = await this.match(columns, cards)

    const folders: ColumnFolder[] = []
    const retitled = new Map<string, string>()

    for (const [column, at] of chosen) {
      const was = this.written.folder(column.id)
      let name = at
      let title = column.title

      if (was && was.name !== name) {
        title = name
        retitled.set(column.id, name)
      } else if (was && was.title !== title) {
        name = await this.rename(at, column, taken)
      }

      this.written.setFolder(column.id, { name, title })
      folders.push(new ColumnFolder(this.fs, column, `${this.root}/${name}`))
    }

    this.written.keepFolders(new Set(columns.map((column) => column.id)))
    return { folders, retitled }
  }

  /**
   * The folder each column lives in, and the folder names already spoken for.
   * Every column comes back with one, whether it was on disk or had to be made
   * up.
   */
  private async match(
    columns: Column[],
    cards: Card[]
  ): Promise<{ chosen: Map<Column, string>; taken: Set<string> }> {
    const names = (await this.fs.readDirs(this.root)) ?? []
    const free = new Set(names.filter((name) => !OWNED.test(name)))
    const taken = new Set(names.map((name) => name.toLowerCase()))

    const chosen = new Map<Column, string>()
    const waiting = new Set(columns)
    const take = (column: Column, name: string) => {
      chosen.set(column, name)
      waiting.delete(column)
      free.delete(name)
    }

    // Still where the vault left it.
    for (const column of columns) {
      const name = this.written.folder(column.id)?.name
      if (name !== undefined && free.has(name)) take(column, name)
    }

    // Renamed on disk: a renamed folder keeps its files, so the ids in them
    // say which column it is.
    const byId = new Map(columns.map((column) => [column.id, column]))
    const owners = new Map(cards.map((card) => [card.id, card.columnId]))
    for (const name of [...free]) {
      const owner = await this.ownerOf(name, owners)
      if (owner === null) continue
      const column = byId.get(owner)
      if (column && waiting.has(column)) take(column, name)
    }

    // An empty folder has nothing inside to go by, but one folder unaccounted
    // for and one column looking for one can only be each other.
    if (waiting.size === 1 && free.size === 1) {
      const [column] = waiting
      const [name] = free
      take(column, name)
    }

    // A new column, or one whose folder is gone. A folder already named after
    // it was mirrored before this vault knew anything: a clone, a reinstall.
    for (const column of [...waiting]) {
      const wanted = snakeName(column.title) || column.id
      take(column, free.has(wanted) ? wanted : claim(wanted, taken))
    }

    return { chosen, taken }
  }

  /** Moves a folder to match its column's new title, files and all. */
  private async rename(
    from: string,
    column: Column,
    taken: Set<string>
  ): Promise<string> {
    const wanted = snakeName(column.title) || column.id
    // Two titles can snake to one name, and then there is nothing to move.
    if (wanted === from) return from

    const to = claim(wanted, taken)
    await this.fs.rename(`${this.root}/${from}`, `${this.root}/${to}`)
    this.written.reroot(`${this.root}/${from}`, `${this.root}/${to}`)
    return to
  }

  /** Which column the cards in a folder belong to, if any of them says. */
  private async ownerOf(
    folder: string,
    owners: Map<string, string>
  ): Promise<string | null> {
    const path = `${this.root}/${folder}`
    for (const name of (await this.fs.readDir(path)) ?? []) {
      if (!name.endsWith(".md") || name.startsWith(".")) continue
      const text = await this.fs.read(`${path}/${name}`)
      if (text === null) continue
      const owner = owners.get(CardFile.parse(text).id)
      if (owner) return owner
    }
    return null
  }
}
