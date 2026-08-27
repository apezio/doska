import type { Column } from "@doska/contract"
import { CardFile } from "./card-file"

/** The filesystem, as much of it as the vault needs. */
export interface VaultFs {
  /** The file's text, or null when it isn't there. */
  read(path: string): Promise<string | null>
  write(path: string, content: string): Promise<void>
  /** Creates a folder and any missing parents; fine if it's already there. */
  mkdir(path: string): Promise<void>
  rename(from: string, to: string): Promise<void>
  /** One level of a folder, or null when the folder isn't there. */
  readDir(path: string): Promise<string[] | null>
  /** Watches a folder and everything under it. */
  watch(path: string, listener: () => void): Promise<() => void>
}

/** A card file as found on disk. */
export interface VaultFile {
  path: string
  text: string
  card: CardFile
}

/**
 * A title as a name on disk: lowercase, words joined by underscores. Letters of
 * any script survive, so a Cyrillic title doesn't come out as one long run of
 * underscores.
 */
export function snakeName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .slice(0, 60)
    .replace(/^_+|_+$/g, "")
}

/** The folder a file sits in. */
export function dirOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"))
}

/** A file's name without its `.md`. */
export function stemOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "")
}

/**
 * Takes `name`, or `name_2` when it's taken, and marks it used. Compared
 * case-insensitively: APFS would collide on "Inbox" and "inbox".
 */
export function claim(name: string, taken: Set<string>): string {
  let candidate = name
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
    candidate = `${name}_${n}`
  }
  taken.add(candidate.toLowerCase())
  return candidate
}

/** A column as a folder of card files. */
export class ColumnFolder {
  readonly columnId: string
  readonly path: string

  private readonly fs: VaultFs
  /** Names handed out this pass, so two cards can't claim the same file. */
  private readonly used = new Set<string>()

  constructor(fs: VaultFs, root: string, column: Column) {
    this.fs = fs
    this.columnId = column.id
    this.path = `${root}/${snakeName(column.title) || column.id}`
  }

  async ensure(): Promise<void> {
    await this.fs.mkdir(this.path)
  }

  async list(): Promise<VaultFile[]> {
    const names = await this.fs.readDir(this.path)
    if (!names) return []

    const files: VaultFile[] = []
    for (const name of names) {
      if (!name.endsWith(".md") || name.startsWith(".")) continue
      const path = `${this.path}/${name}`
      const text = await this.fs.read(path)
      if (text === null) continue
      this.used.add(stemOf(name).toLowerCase())
      files.push({ path, text, card: CardFile.parse(text) })
    }
    return files
  }

  /** Writes `card` to `at`, or to a fresh name when it has no file yet. */
  async save(card: CardFile, at?: string): Promise<string> {
    const path = at ?? `${this.path}/${this.freeName(card)}`
    await this.fs.write(path, card.text)
    return path
  }

  /** Moves a file into this folder. */
  async take(from: string, card: CardFile): Promise<string> {
    const to = `${this.path}/${this.freeName(card)}`
    await this.fs.rename(from, to)
    return to
  }

  private freeName(card: CardFile): string {
    return `${claim(snakeName(card.title) || "card", this.used)}.md`
  }
}
