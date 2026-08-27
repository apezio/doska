import type { Card } from "@doska/contract"
import { parse, stringify } from "yaml"

const FENCE = "---"

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

/**
 * A card as a Markdown file: its fields as YAML frontmatter, then the body.
 * Converts both ways, so this is the only place that knows how a card looks on
 * disk.
 */
export class CardFile {
  /** Empty for a file the user wrote by hand; the vault adopts it as a card. */
  readonly id: string
  readonly title: string
  readonly body: string
  readonly deadline: string
  readonly priority: string

  constructor(fields: {
    id?: string
    title?: string
    body?: string
    deadline?: string
    priority?: string
  }) {
    this.id = fields.id ?? ""
    this.title = fields.title ?? ""
    this.body = clean(fields.body ?? "")
    this.deadline = fields.deadline ?? ""
    this.priority = fields.priority ?? ""
  }

  static fromCard(card: Card): CardFile {
    return new CardFile({
      id: card.id,
      title: card.title,
      body: card.body,
      deadline: card.deadline ?? "",
      priority: card.priority,
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
    return new CardFile({
      id: text(front.id),
      title: text(front.title),
      body: lines.slice(close + 1).join("\n"),
      deadline: text(front.deadline),
      priority: text(front.priority),
    })
  }

  get text(): string {
    const front: Record<string, string> = { id: this.id, title: this.title }
    if (this.deadline) front.deadline = this.deadline
    if (this.priority) front.priority = this.priority

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
