import type { Card } from "@doska/contract"
import { canonicalBody } from "./body"
import {
  quoted,
  readFrontmatter,
  readList,
  readText,
  writeFrontmatter,
} from "./frontmatter"
import { deslug, slug } from "./paths"

const FENCE = "---"

/** The keys the mirror writes. Anything else in the frontmatter is the user's. */
const OWNED = ["id", "title", "deadline", "priority", "aliases"]

/** An alias of digits alone is the mirror's; the user's own pass through. */
const NUMBER_ALIAS = /^\d+$/

/**
 * A card as a file: frontmatter, then the body.
 */
export class CardFile {
  readonly frontmatter: Record<string, unknown>
  readonly body: string

  constructor(frontmatter: Record<string, unknown> = {}, body = "") {
    this.frontmatter = frontmatter
    this.body = canonicalBody(body)
  }

  static parse(text: string): CardFile {
    const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n")
    const lines = normalized.split("\n")
    const close = lines[0] === FENCE ? lines.indexOf(FENCE, 1) : -1
    const frontmatter =
      close === -1 ? null : readFrontmatter(lines.slice(1, close).join("\n"))

    if (!frontmatter) return new CardFile({}, normalized)

    return new CardFile(frontmatter, lines.slice(close + 1).join("\n"))
  }

  /** The file a card should be, keeping the frontmatter the mirror doesn't own. */
  static fromCard(card: Card, previous?: CardFile): CardFile {
    const aliases = [
      ...(card.number === null ? [] : [String(card.number)]),
      ...(previous?.aliases ?? []),
    ]

    const frontmatter: Record<string, unknown> = {
      id: card.id,
      title: card.title,
    }
    if (card.deadline) frontmatter.deadline = card.deadline
    if (card.priority) frontmatter.priority = card.priority
    if (aliases.length > 0) frontmatter.aliases = aliases

    return new CardFile({ ...frontmatter, ...previous?.extra }, card.body)
  }

  get id(): string | null {
    return readText(this.frontmatter.id)
  }

  /** The precise title, or null when only the filename says it. */
  get title(): string | null {
    return readText(this.frontmatter.title)
  }

  get deadline(): string | null {
    return readText(this.frontmatter.deadline)
  }

  get priority(): string | null {
    return readText(this.frontmatter.priority)
  }

  /** Kept as an alias so `[[12]]` resolves in Obsidian too. */
  get number(): number | null {
    const alias = this.allAliases.find((entry) => NUMBER_ALIAS.test(entry))
    return alias === undefined ? null : Number(alias)
  }

  /** The aliases the user added, without the mirror's number. */
  get aliases(): string[] {
    return this.allAliases.filter((entry) => !NUMBER_ALIAS.test(entry))
  }

  get extra(): Record<string, unknown> {
    const extra: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(this.frontmatter)) {
      if (!OWNED.includes(key)) extra[key] = value
    }
    return extra
  }

  /** The file on disk  */
  get text(): string {
    const fields = { ...this.frontmatter }
    if (this.title !== null) fields.title = quoted(this.title)

    const body = this.body ? `${this.body}\n` : ""
    return `${FENCE}\n${writeFrontmatter(fields)}${FENCE}\n${body}`
  }

  private get allAliases(): string[] {
    return readList(this.frontmatter.aliases)
  }

  resolveTitle(fileSlug: string, base: string): string {
    if (this.title !== null && this.title !== base) return this.title
    if (fileSlug !== slug(base)) return deslug(fileSlug)
    return this.title ?? base
  }
}
