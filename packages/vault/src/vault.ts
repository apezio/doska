import type { Card, Column } from "@doska/contract"
import { CardFile, type CardPatch } from "./card-file"
import {
  claim,
  ColumnFolder,
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

/** The board, as much of it as the vault needs. The app wires this to its store. */
export interface VaultBoard {
  /** The board's live columns and cards. */
  load(): Promise<{ columns: Column[]; cards: Card[] }>
  createCard(columnId: string): Promise<string>
  updateCard(id: string, patch: CardPatch): Promise<void>
  moveCardToColumn(id: string, columnId: string): Promise<void>
  /** Trashes the card. Recoverable: a stray delete in Finder shouldn't be final. */
  deleteCard(id: string): Promise<void>
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
 * card, deleted cards under `.trash`.
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
   * user edits. Empty at startup, which is what makes the file win the first
   * time round: the app wasn't running to write it. */
  private readonly written = new Map<string, { path: string; text: string }>()

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
    for (const folder of folders) {
      for (const file of await folder.list()) {
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

    const byColumn = new Map(folders.map((f) => [f.columnId, f]))
    for (const card of cards.values()) {
      if (await this.reconcile(card, files.get(card.id), byColumn))
        changed = true
    }

    // Whatever is left has no live card behind it any more. The file keeps its
    // own name: its id is in the frontmatter, so nothing needs it in the name.
    for (const [id, { file }] of files) {
      if (cards.has(id)) continue
      const name = claim(stemOf(file.path), inTrash)
      await this.fs.rename(file.path, `${this.root}/${TRASH}/${name}.md`)
      this.written.delete(id)
    }

    if (changed) this.onBoardChange?.()
  }

  /** Files under `.trash` whose card is still live: someone dragged them there. */
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
    const wanted = CardFile.fromCard(card)
    if (!changed && wanted.text !== file.text) {
      await folder.save(wanted, file.path)
      this.written.set(card.id, { path: file.path, text: wanted.text })
    }
    return changed
  }
}
