import type { Card, Column } from "@doska/contract"
import { CardFile, type CardPatch } from "./card-file"
import {
  claim,
  ColumnFolder,
  dirOf,
  stemOf,
  type VaultFile,
  type VaultFs,
} from "./column-folder"

/**
 * Cards deleted on either side land here. Not `.trash`: Tauri's fs scope sets
 * `require_literal_leading_dot` on unix, so a dotfolder inside the vault is
 * unreachable however wide the grant is.
 */
const TRASH = "_trash"

/** Where `written` is kept between runs. */
const META = "_meta.json"

/** The board, as much of it as the vault needs. The app wires this to its store. */
export interface VaultBoard {
  /** The board's live columns and cards. */
  load(): Promise<{ columns: Column[]; cards: Card[] }>
  createCard(columnId: string): Promise<string>
  updateCard(id: string, patch: CardPatch): Promise<void>
  moveCardToColumn(id: string, columnId: string): Promise<void>
  /** Trashes the card. Recoverable: a stray delete in Finder shouldn't be final. */
  deleteCard(id: string): Promise<void>
  /** Brings a trashed card back, for a file dragged out of `_trash`. */
  restoreCard(id: string): Promise<void>
}

export interface VaultOptions {
  fs: VaultFs
  board: VaultBoard
  /** The folder the board lives in. */
  root: string
  /** Called after the vault changed the board, so the app can refetch. */
  onBoardChange?: () => void
  /** A sync that failed. Nothing above the watcher can catch these. */
  onError?: (error: unknown) => void
}

/**
 * A board mirrored to a folder: one folder per column, one Markdown file per
 * card, deleted cards under `_trash`.
 *
 * Any change on either side runs one pass over the whole tree. That makes a
 * card moved between folders indistinguishable from a delete plus a create,
 * which is the point: there is no event to miss.
 */
export class Vault {
  private readonly fs: VaultFs
  private readonly board: VaultBoard
  private readonly root: string
  private readonly onBoardChange?: () => void
  private readonly onError?: (error: unknown) => void

  /** What the vault last wrote per card, so its own writes don't read back as
   * user edits. Kept in `_meta.json` between runs: without it the vault can't
   * tell a file the user deleted from one it has never written, and every card
   * of a board it wrote yesterday would look deleted today. */
  private readonly written = new Map<string, { path: string; text: string }>()
  /** The last `_meta.json` on disk, so an unchanged pass doesn't rewrite it. */
  private meta = ""
  private loaded = false

  private running = false
  private queued = false

  constructor({ fs, board, root, onBoardChange, onError }: VaultOptions) {
    this.fs = fs
    this.board = board
    this.root = root
    this.onBoardChange = onBoardChange
    this.onError = onError
  }

  /** Watches the folder. Returns a function that stops watching. */
  async watch(): Promise<() => void> {
    await this.sync()
    return this.fs.watch(this.root, () => {
      this.sync().catch((error: unknown) => this.onError?.(error))
    })
  }

  /** Brings the folder and the board back into agreement, both ways. */
  async sync(): Promise<void> {
    if (this.running) {
      this.queued = true
      return
    }
    this.running = true
    try {
      do {
        this.queued = false
        await this.pass()
      } while (this.queued)
    } finally {
      this.running = false
    }
  }

  private async pass(): Promise<void> {
    // A root that isn't there any more is not an empty board: bail, or a
    // folder that was moved or unmounted would trash every card on it.
    if ((await this.fs.readDir(this.root)) === null) return

    if (!this.loaded) await this.readMeta()

    const board = await this.board.load()
    const folders = board.columns.map(
      (column) => new ColumnFolder(this.fs, this.root, column)
    )
    await this.fs.mkdir(`${this.root}/${TRASH}`)
    for (const folder of folders) await folder.ensure()

    const cards = new Map(board.cards.map((card) => [card.id, card]))

    const inTrash = new Set<string>()
    let changed = await this.trashed(cards, inTrash)

    const files = new Map<string, { file: VaultFile; folder: ColumnFolder }>()
    const empty = new Set<string>()
    for (const folder of folders) {
      const listed = await folder.list()
      if (listed.length === 0) empty.add(folder.path)
      for (const file of listed) {
        const id = file.card.id
        // A file with no id is a note someone dropped in, and a copy of a card
        // is a new card too: both become one.
        if (!id || files.has(id)) {
          await this.adopt(file, folder)
          changed = true
          continue
        }
        files.set(id, { file, folder })
      }
    }

    // A folder that lost every one of its files at once is a folder event, not
    // one delete per card: a cloud client resyncing, or the folder itself
    // dropped. Its cards keep their files, which get written back below.
    const wrote = new Map<string, number>()
    for (const { path } of this.written.values()) {
      const dir = dirOf(path)
      wrote.set(dir, (wrote.get(dir) ?? 0) + 1)
    }
    const wiped = new Set<string>()
    for (const dir of empty) {
      if ((wrote.get(dir) ?? 0) > 1) wiped.add(dir)
    }

    const byColumn = new Map(folders.map((f) => [f.columnId, f]))
    for (const card of cards.values()) {
      const found = files.get(card.id)
      const last = this.written.get(card.id)
      // The vault wrote this file and can't find it any more, so it was
      // deleted. A copy goes to the trash: the file is gone, the card isn't
      // yet. Without `last` the file was never written, which is a first pass,
      // not a delete.
      if (!found && last && !wiped.has(dirOf(last.path))) {
        const name = claim(stemOf(last.path), inTrash)
        await this.fs.write(`${this.root}/${TRASH}/${name}.md`, last.text)
        await this.board.deleteCard(card.id)
        this.written.delete(card.id)
        changed = true
        continue
      }
      if (await this.reconcile(card, found, byColumn)) changed = true
    }

    // Whatever is left has no live card behind it any more.
    for (const [id, { file, folder }] of files) {
      if (cards.has(id)) continue

      // The vault didn't put this file here, so the user did: it came back out
      // of the trash. The card comes back with it, into the folder it landed in.
      if (!this.written.has(id)) {
        await this.board.restoreCard(id)
        await this.board.moveCardToColumn(id, folder.columnId)
        changed = true
        continue
      }

      // The file keeps its own name: its id is in the frontmatter, so nothing
      // needs it in the name.
      const name = claim(stemOf(file.path), inTrash)
      await this.fs.rename(file.path, `${this.root}/${TRASH}/${name}.md`)
      this.written.delete(id)
    }

    await this.writeMeta()
    if (changed) this.onBoardChange?.()
  }

  private serialize(): string {
    const ids = [...this.written.keys()].sort()
    const entries = ids.map((id) => [id, this.written.get(id)] as const)
    return JSON.stringify(Object.fromEntries(entries), null, 2)
  }

  private async readMeta(): Promise<void> {
    this.loaded = true
    const text = await this.fs.read(`${this.root}/${META}`)
    if (text === null) return

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return
    }
    if (typeof parsed !== "object" || parsed === null) return

    for (const [id, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      if (typeof value !== "object" || value === null) continue
      const entry = value as { path?: unknown; text?: unknown }
      if (typeof entry.path !== "string" || typeof entry.text !== "string") {
        continue
      }
      this.written.set(id, { path: entry.path, text: entry.text })
    }
    this.meta = this.serialize()
  }

  private async writeMeta(): Promise<void> {
    const text = this.serialize()
    // Only on a change: every write wakes the watcher, and an unconditional one
    // would keep waking it for ever.
    if (text === this.meta) return
    this.meta = text
    await this.fs.write(`${this.root}/${META}`, text)
  }

  /** Files under `_trash` whose card is still live: someone dragged them there. */
  private async trashed(
    cards: Map<string, Card>,
    taken: Set<string>
  ): Promise<boolean> {
    const names = await this.fs.readDir(`${this.root}/${TRASH}`)
    if (!names) return false

    let changed = false
    for (const name of names) {
      if (!name.endsWith(".md")) continue
      taken.add(stemOf(name).toLowerCase())
      const text = await this.fs.read(`${this.root}/${TRASH}/${name}`)
      if (text === null) continue
      const id = CardFile.parse(text).id
      if (!id || !cards.has(id)) continue

      await this.board.deleteCard(id)
      cards.delete(id)
      this.written.delete(id)
      changed = true
    }
    return changed
  }

  /** Turns a file that isn't a card yet into one, then stamps it with its id. */
  private async adopt(file: VaultFile, folder: ColumnFolder): Promise<void> {
    const id = await this.board.createCard(folder.columnId)
    const card = new CardFile({
      id,
      title: file.card.title || stemOf(file.path),
      body: file.card.body,
      deadline: file.card.deadline,
      priority: file.card.priority,
      extra: file.card.extra,
    })

    await this.board.updateCard(id, {
      title: card.title,
      body: card.body,
      deadline: card.deadline || null,
      priority: card.priority,
    })
    await folder.save(card, file.path)
    this.written.set(id, { path: file.path, text: card.text })
  }

  /** One card against its file. Returns whether the board changed. */
  private async reconcile(
    card: Card,
    found: { file: VaultFile; folder: ColumnFolder } | undefined,
    byColumn: Map<string, ColumnFolder>
  ): Promise<boolean> {
    if (!found) {
      const folder = byColumn.get(card.columnId)
      if (!folder) return false
      const file = CardFile.fromCard(card)
      this.written.set(card.id, {
        path: await folder.save(file),
        text: file.text,
      })
      return false
    }

    const { file, folder } = found
    const last = this.written.get(card.id)
    let changed = false

    if (!last || last.text !== file.text) {
      const patch = file.card.patchFor(card)
      if (patch) {
        await this.board.updateCard(card.id, patch)
        changed = true
      }
      this.written.set(card.id, { path: file.path, text: file.text })
    }

    if (folder.columnId !== card.columnId) {
      if (last && last.path === file.path) {
        // The file didn't move, so the card did: follow it.
        const target = byColumn.get(card.columnId)
        if (target) {
          const path = await target.take(file.path, file.card)
          this.written.set(card.id, { path, text: file.text })
        }
      } else {
        await this.board.moveCardToColumn(card.id, folder.columnId)
        changed = true
      }
      return changed
    }

    // The card is ahead of the file only when the file wasn't the one to move.
    const wanted = CardFile.fromCard(card, file.card.extra)
    if (!changed && wanted.text !== file.text) {
      const path = await folder.retitle(file.path, wanted)
      await folder.save(wanted, path)
      this.written.set(card.id, { path, text: wanted.text })
    }
    return changed
  }
}
