/** The mirror's own folder inside a link. Never mirrored, never imported. */
export const VAULT_DIR = ".doska"
export const MIRROR_FILE = `${VAULT_DIR}/mirror.json`
export const TRASH_DIR = `${VAULT_DIR}/trash`
export const HISTORY_FILE = `${VAULT_DIR}/history`

/** Long enough to stay readable, short enough for any filesystem's limit. */
const MAX_NAME = 60

const CARD_FILE = /^(?:(\d+)|(card-[0-9a-f]{12}))-(.*)\.md$/

/** What a card file's name says: its prefix, split by grammar, and the slug. */
export interface CardFileName {
  /** The card number, when the prefix is one. */
  number: number | null
  /** The card id, used as the prefix until the first sync assigns a number. */
  id: string | null
  slug: string
}

function sanitize(text: string, keepSpaces: boolean): string {
  const drop = keepSpaces ? /[^\p{L}\p{N} ]+/gu : /[^\p{L}\p{N}]+/gu
  return text
    .replace(drop, "-")
    .replace(/ +/g, " ")
    .slice(0, MAX_NAME)
    .replace(/^[-\s]+|[-\s]+$/g, "")
}

/** A card title as it appears in a filename. Empty is legal (`12-.md`). */
export function slug(title: string): string {
  return sanitize(title.toLowerCase(), false)
}

/** The title a slug came from, as far as it can be recovered. */
export function deslug(text: string): string {
  return text.replaceAll("-", " ").trim()
}

export function cardFileName(prefix: string, title: string): string {
  return `${prefix}-${slug(title)}.md`
}

/** Reads a card file's name, or null when it isn't one of ours. */
export function parseCardFileName(name: string): CardFileName | null {
  const match = CARD_FILE.exec(name)
  if (!match) return null
  return {
    number: match[1] === undefined ? null : Number(match[1]),
    id: match[2] ?? null,
    slug: match[3],
  }
}

/** A board or column folder: the title, keeping spaces and case, or the id. */
export function folderName(title: string, id: string): string {
  return sanitize(title, true) || id
}

/**
 * `name`, or `name (2)` when something already goes by it. Compared
 * case-insensitively: APFS would collide on "Inbox" and "inbox".
 */
export function uniqueName(name: string, taken: Iterable<string>): string {
  const lower = new Set([...taken].map((entry) => entry.toLowerCase()))
  if (!lower.has(name.toLowerCase())) return name
  for (let n = 2; ; n++) {
    const candidate = `${name} (${n})`
    if (!lower.has(candidate.toLowerCase())) return candidate
  }
}

export function joinPath(...parts: string[]): string {
  return parts.filter(Boolean).join("/")
}

/** The folder a path sits in; "" for something at the root. */
export function dirPath(path: string): string {
  const cut = path.lastIndexOf("/")
  return cut === -1 ? "" : path.slice(0, cut)
}
