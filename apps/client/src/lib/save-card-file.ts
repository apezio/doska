const PATH_KEY = "doska:card-file-path:"

function rememberedPath(cardId: string): string | null {
  return localStorage.getItem(PATH_KEY + cardId)
}

/**
 * Writes `bytes` to the path this card was last saved to, asking for one only
 * when there isn't a usable path yet.
 *
 * A remembered path can stop being writable between launches — the file was
 * moved, or the fs scope grant behind it was lost — and the scope failure is
 * indistinguishable from any other write error here, so a failed write always
 * falls back to the picker rather than trying to classify it.
 *
 * Returns the path written, or null when the user cancelled.
 */
export async function saveCardFile(
  cardId: string,
  suggestedName: string,
  bytes: Uint8Array
): Promise<string | null> {
  const { writeFile } = await import("@tauri-apps/plugin-fs")

  const known = rememberedPath(cardId)
  if (known) {
    try {
      await writeFile(known, bytes)
      return known
    } catch {
      localStorage.removeItem(PATH_KEY + cardId)
    }
  }

  const { save } = await import("@tauri-apps/plugin-dialog")
  const path = await save({
    defaultPath: suggestedName,
    filters: [{ name: "Markdown", extensions: ["md"] }],
  })
  if (!path) return null

  await writeFile(path, bytes)
  localStorage.setItem(PATH_KEY + cardId, path)
  return path
}

/** `# Title` followed by the card's body, which is already Markdown. */
export function cardToMarkdown(title: string, body: string): string {
  return `# ${title}\n\n${body}\n`
}

export function cardFileName(title: string): string {
  return `${title.replace(/[/\\]/g, "_").trim() || "card"}.md`
}
