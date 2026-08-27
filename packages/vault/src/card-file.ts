import type { Attachment, Card } from "@doska/contract"
import { parse, stringify } from "yaml"

const FENCE = "---"

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

function attachmentsOf(value: unknown): Attachment[] {
  return Array.isArray(value) ? (value as Attachment[]) : []
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
  readonly number: string
  readonly title: string
  readonly body: string
  readonly deadline: string
  readonly priority: string
  /** Carried through untouched: the files themselves live outside the vault,
   * so hand-editing this can only break the card. */
  readonly attachments: Attachment[]
  /** Frontmatter keys the vault doesn't know, kept so the user's own notes to
   * self survive a rewrite. */
  readonly extra: Record<string, unknown>

  constructor(fields: {
    id?: string
    number?: string
    title?: string
    body?: string
    deadline?: string
    priority?: string
    attachments?: Attachment[]
    extra?: Record<string, unknown>
  }) {
    this.id = fields.id ?? ""
    this.number = fields.number ?? ""
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
      number: card.number === null ? "" : String(card.number),
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
    if (close === -1) return new CardFile({ body: source })

    let fields: unknown
    try {
      fields = parse(lines.slice(1, close).join("\n"))
    } catch {
      return new CardFile({ body: source })
    }
    if (
      typeof fields !== "object" ||
      fields === null ||
      Array.isArray(fields)
    ) {
      return new CardFile({ body: source })
    }

    const front = fields as Record<string, unknown>
    const extra: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(front)) {
      if (!KNOWN.includes(key)) extra[key] = value
    }

    return new CardFile({
      id: text(front.id),
      number: text(front.number),
      title: text(front.title),
      body: lines.slice(close + 1).join("\n"),
      deadline: text(front.deadline),
      priority: text(front.priority),
      attachments: attachmentsOf(front.attachments),
      extra,
    })
  }

  get text(): string {
    const front: Record<string, unknown> = { id: this.id }
    // A number, not a string, or YAML quotes it and the file reads oddly.
    if (this.number) front.number = Number(this.number)
    front.title = this.title
    if (this.deadline) front.deadline = this.deadline
    if (this.priority) front.priority = this.priority
    if (this.attachments.length > 0) front.attachments = this.attachments
    Object.assign(front, this.extra)

    const body = this.body ? `${this.body}\n` : ""
    return `${FENCE}\n${stringify(front, { lineWidth: 0 })}${FENCE}\n${body}`
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
