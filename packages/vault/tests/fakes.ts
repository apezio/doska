import type { Card, Column } from "@doska/contract"
import type { VaultFs } from "../src/column-folder"
import type { VaultBoard } from "../src/vault"

/** Files keyed by path; folders are implied by the paths under them. */
export class MemoryFs implements VaultFs {
  readonly files = new Map<string, string>()
  private readonly dirs = new Set<string>()
  private listener: (() => void) | null = null

  read(path: string) {
    return Promise.resolve(this.files.get(path) ?? null)
  }

  write(path: string, content: string) {
    this.files.set(path, content)
    return Promise.resolve()
  }

  mkdir(path: string) {
    this.dirs.add(path)
    return Promise.resolve()
  }

  rename(from: string, to: string) {
    const content = this.files.get(from)
    if (content !== undefined) {
      this.files.delete(from)
      this.files.set(to, content)
    }
    return Promise.resolve()
  }

  readDir(path: string) {
    if (!this.dirs.has(path)) return Promise.resolve(null)
    const names: string[] = []
    for (const file of this.files.keys()) {
      if (file.startsWith(`${path}/`)) names.push(file.slice(path.length + 1))
    }
    return Promise.resolve(names.filter((name) => !name.includes("/")))
  }

  watch(_path: string, listener: () => void) {
    this.listener = listener
    return Promise.resolve(() => {
      this.listener = null
    })
  }

  /** The root gone from under the vault: an unmounted drive, a moved folder. */
  wipe() {
    this.files.clear()
    this.dirs.clear()
  }

  /** Pretends the folder changed, the way the real watcher would. */
  touch() {
    this.listener?.()
  }
}

let seq = 0

export function makeCard(fields: Partial<Card> & { columnId: string }): Card {
  return {
    id: `card-${++seq}`,
    title: "",
    body: "",
    position: "a0",
    number: null,
    deadline: null,
    priority: "",
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    ...fields,
  }
}

export function makeColumn(id: string, title: string): Column {
  return {
    id,
    title,
    position: "a0",
    dashboardId: "board-1",
    collapsed: false,
    color: "",
    done: false,
    updatedAt: 0,
    deletedAt: null,
  }
}

export class FakeBoard implements VaultBoard {
  readonly cardsById = new Map<string, Card>()
  readonly trashed = new Map<string, Card>()
  readonly deleted: string[] = []

  private readonly cols: Column[]

  constructor(cols: Column[]) {
    this.cols = cols
  }

  add(card: Card) {
    this.cardsById.set(card.id, card)
    return card
  }

  load() {
    return Promise.resolve({
      columns: this.cols,
      cards: [...this.cardsById.values()],
    })
  }

  createCard(columnId: string) {
    const card = makeCard({ columnId })
    this.cardsById.set(card.id, card)
    return Promise.resolve(card.id)
  }

  updateCard(id: string, patch: Partial<Card>) {
    const card = this.cardsById.get(id)
    if (card) this.cardsById.set(id, { ...card, ...patch })
    return Promise.resolve()
  }

  moveCardToColumn(id: string, columnId: string) {
    const card = this.cardsById.get(id)
    if (card) this.cardsById.set(id, { ...card, columnId })
    return Promise.resolve()
  }

  deleteCard(id: string) {
    const card = this.cardsById.get(id)
    if (card) this.trashed.set(id, card)
    this.deleted.push(id)
    this.cardsById.delete(id)
    return Promise.resolve()
  }

  restoreCard(id: string) {
    const card = this.trashed.get(id)
    if (card) {
      this.trashed.delete(id)
      this.cardsById.set(id, card)
    }
    return Promise.resolve()
  }
}
