import type { Attachment, Card } from "@doska/contract"
import { parse, stringify } from "yaml"

const FENCE = "---"

/** Attachments mirror into `<root>/_files`, one level up from a card file. */
export const FILES = "_files"
const FILES_REF = `../${FILES}/`

/** An attachment's name inside `_files`. Keys are `att/<uuid>.<ext>`. */
export function fileNameOf(key: string): string {
  return key.slice(key.indexOf("/") + 1)
}

const ATTACHMENT_SRC = /(!\[[^\]]*\]\()attachment:att\/([^)\s]+\))/g
const FILE_SRC = /(!\[[^\]]*\]\()\.\.\/_files\/([^)\s]+\))/g

/**
 * Image refs, on disk and back. The app stores `attachment:att/<uuid>.png`,
 * which resolves to nothing outside the app, so a mirrored body points at the
 * mirrored file instead. Both directions, or the rewritten body reads back as
 * an edit and overwrites the card's real one every pass.
 */
function toFileRefs(body: string): string {
  return body.replace(ATTACHMENT_SRC, (_, open: string, rest: string) => {
    return `${open}${FILES_REF}${rest}`
  })
}

function toAttachmentRefs(body: string): string {
  return body.replace(FILE_SRC, (_, open: string, rest: string) => {
    return `${open}attachment:att/${rest}`
  })
}

/** Keys the vault owns. Anything else in the frontmatter is the user's. */
const KNOWN = ["id", "number", "title", "deadline", "priority", "attachments"]

export type CardPatch = Partial<
  Pick<Card, "title" | "body" | "deadline" | "priority">
>

/** LF endings and no trailing whitespace, so a stray newline isn't an edit. */
function clean(body: string): string {
  return body.replace(/\r\n?/g, "\n").trim()
}

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim()
}

function numberOf(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value !== "string" || value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * A card as a Markdown file: its fields as YAML frontmatter, then the body.
 * Converts both ways, so this is the only place that knows how a card looks on
 * disk.
 */
export class CardFile {
  /** Empty for a file the user wrote by hand; the vault adopts it as a card. */
  readonly id: string
  /** The card's human-readable number. The board hands it out, so a file can
   * only ever report it. */
  readonly number: number | null
  readonly title: string
  readonly body: string
  readonly deadline: string
  readonly priority: string
  /** Write-only: `parse` never reads these back, so hand-editing the list
   * can't break the card. The board owns them. */
  readonly attachments: Attachment[]
  /** Frontmatter keys the vault doesn't know, kept so the user's own notes to
   * self survive a rewrite. */
  readonly extra: Record<string, unknown>

  constructor(fields: {
    id?: string
    number?: number | null
    title?: string
    body?: string
    deadline?: string
    priority?: string
    attachments?: Attachment[]
    extra?: Record<string, unknown>
  }) {
    this.id = fields.id ?? ""
    this.number = fields.number ?? null
    this.title = fields.title ?? ""
    this.body = clean(fields.body ?? "")
    this.deadline = fields.deadline ?? ""
    this.priority = fields.priority ?? ""
    this.attachments = fields.attachments ?? []
    this.extra = fields.extra ?? {}
  }

  /** `extra` carries the frontmatter keys of the file being rewritten, so a
   * write from the board doesn't drop what the user added by hand. */
  static fromCard(card: Card, extra: Record<string, unknown> = {}): CardFile {
    return new CardFile({
      id: card.id,
      number: card.number,
      title: card.title,
      body: card.body,
      deadline: card.deadline ?? "",
      priority: card.priority,
      attachments: card.attachments,
      extra,
    })
  }

  /** A file with no frontmatter is all body, which is how a dropped-in note
   * becomes a card. */
  static parse(source: string): CardFile {
    const lines = source.replace(/\r\n?/g, "\n").split("\n")
    const close = lines[0] === FENCE ? lines.indexOf(FENCE, 1) : -1
    if (close === -1) return new CardFile({ body: toAttachmentRefs(source) })

    let fields: unknown
    try {
      fields = parse(lines.slice(1, close).join("\n"))
    } catch {
      return new CardFile({ body: toAttachmentRefs(source) })
    }
    if (
      typeof fields !== "object" ||
      fields === null ||
      Array.isArray(fields)
    ) {
      return new CardFile({ body: toAttachmentRefs(source) })
    }

    const front = fields as Record<string, unknown>
    const extra: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(front)) {
      if (!KNOWN.includes(key)) extra[key] = value
    }

    return new CardFile({
      id: text(front.id),
      number: numberOf(front.number),
      title: text(front.title),
      body: toAttachmentRefs(lines.slice(close + 1).join("\n")),
      deadline: text(front.deadline),
      priority: text(front.priority),
      extra,
    })
  }

  get text(): string {
    const body = toFileRefs(this.body)
    const front: Record<string, unknown> = { id: this.id }
    if (this.number !== null) front.number = this.number
    front.title = this.title
    if (this.deadline) front.deadline = this.deadline
    if (this.priority) front.priority = this.priority
    // Only the ones the body doesn't already show, and name and path only:
    // nothing reads this back, it is here so a person can find a file that
    // nothing in the text points at.
    const unshown = this.attachments
      .map((attachment) => ({
        name: attachment.name,
        file: FILES_REF + fileNameOf(attachment.key),
      }))
      .filter((attachment) => !body.includes(attachment.file))
    if (unshown.length > 0) front.attachments = unshown
    Object.assign(front, this.extra)

    const trailing = body ? `${body}\n` : ""
    return `${FENCE}\n${stringify(front, { lineWidth: 0 })}${FENCE}\n${trailing}`
  }

  /** What this file changes about `card`, or null when it says the same. */
  patchFor(card: Card): CardPatch | null {
    const patch: CardPatch = {}
    if (this.title !== card.title) patch.title = this.title
    if (this.body !== clean(card.body)) patch.body = this.body
    if (this.deadline !== (card.deadline ?? "")) {
      patch.deadline = this.deadline || null
    }
    if (this.priority !== card.priority) patch.priority = this.priority
    return Object.keys(patch).length > 0 ? patch : null
  }
}
