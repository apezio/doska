import type { VaultFs } from "./column-folder"

const META = "_meta.json"

/** A file the vault wrote, as it wrote it. */
export interface WrittenFile {
  path: string
  text: string
}

/**
 * What the vault last wrote per card, so its own writes don't read back as user
 * edits. Kept in `_meta.json` between runs.
 */
export class Written {
  private readonly fs: VaultFs
  private readonly path: string
  private readonly entries = new Map<string, WrittenFile>()
  /** The last `_meta.json` on disk, so an unchanged pass doesn't rewrite it. */
  private saved = ""
  private loaded = false

  constructor(fs: VaultFs, root: string) {
    this.fs = fs
    this.path = `${root}/${META}`
  }

  [Symbol.iterator](): IterableIterator<[string, WrittenFile]> {
    return this.entries.entries()
  }

  values(): IterableIterator<WrittenFile> {
    return this.entries.values()
  }

  has(id: string): boolean {
    return this.entries.has(id)
  }

  get(id: string): WrittenFile | undefined {
    return this.entries.get(id)
  }

  set(id: string, file: WrittenFile): void {
    this.entries.set(id, file)
  }

  delete(id: string): void {
    this.entries.delete(id)
  }

  async load(): Promise<void> {
    if (this.loaded) return
    this.loaded = true

    const text = await this.fs.read(this.path)
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
      this.entries.set(id, { path: entry.path, text: entry.text })
    }
    this.saved = this.serialize()
  }

  async save(): Promise<void> {
    const text = this.serialize()
    if (text === this.saved) return
    this.saved = text
    await this.fs.write(this.path, text)
  }

  private serialize(): string {
    const entries = [...this.entries].sort(([a], [b]) => a.localeCompare(b))
    return JSON.stringify(Object.fromEntries(entries), null, 2)
  }
}
