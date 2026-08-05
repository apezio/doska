import { CUT_RE } from "@doska/markdown/core"
import { nested, token, type Context } from "./context"
import { inline } from "./inline"
import type { Token, TokenKind } from "./kinds"

const FENCE = /^\s*(?:```|~~~)/
const TASK = /^(\s*[-*+]\s+\[([ xX])\]\s*)(.*)$/

/** Lines that are one token end to end. */
const WHOLE_LINE: { re: RegExp; kind: TokenKind }[] = [
  { re: CUT_RE, kind: "cut" },
  { re: /^\s*(?:(?:\*|-|_)\s*){3,}$/, kind: "syntax" },
]

/**
 * Lines opening with a run of syntax, the rest ordinary inline text. Each
 * pattern captures the prefix, then the remainder; `kind` styles the remainder.
 */
const PREFIXED: { re: RegExp; kind?: TokenKind }[] = [
  { re: /^(\s*#{1,6}\s+)(.*)$/, kind: "heading" },
  { re: /^(\s*>+\s?)(.*)$/, kind: "quote" },
  { re: /^(\s*(?:[-*+]|\d+[.)])\s+)(.*)$/ },
]

export interface TokenizeOptions {
  /**
   * Wikilink targets that resolve to a real card. Omit and every reference is
   * drawn as live. Case is ignored.
   */
  targets?: Iterable<string>
}

/** Splits one line of ordinary body text into tokens. */
function tokenizeLine(line: string, ctx: Context): Token[] {
  if (!line) return [token("", ctx)]

  for (const { re, kind } of WHOLE_LINE)
    if (re.test(line)) return [token(line, ctx, kind)]

  // Before the bullet rule below, which a task line also matches.
  const task = TASK.exec(line)
  if (task)
    return [
      token(task[1], ctx, "syntax"),
      ...inline(task[3], task[2] === " " ? ctx : nested(ctx, "done")),
    ]

  for (const { re, kind } of PREFIXED) {
    const match = re.exec(line)
    if (!match) continue
    return [
      token(match[1], ctx, "syntax"),
      ...inline(match[2], kind ? nested(ctx, kind) : ctx),
    ]
  }

  return inline(line, ctx)
}

/**
 * Splits a Markdown body into one array of tokens per line, in source order.
 *
 * Line based rather than a walk over the parsed tree, for two reasons: the
 * custom remark plugins rebuild their nodes without `position`, so half the
 * dialect has no source offsets to walk to; and mdast drops the delimiters
 * themselves, which a highlighter has to paint.
 */
export function tokenizeMarkdown(
  value: string,
  { targets }: TokenizeOptions = {}
): Token[][] {
  const ctx: Context = {
    targets: new Set([...(targets ?? [])].map((t) => t.toLowerCase())),
    base: [],
  }
  let inFence = false

  return value.split("\n").map((line) => {
    if (FENCE.test(line)) {
      inFence = !inFence
      return [token(line, ctx, "syntax")]
    }
    // Fenced content is code, so nothing in it is markup to style.
    if (inFence) return [token(line, ctx, "code")]
    return tokenizeLine(line, ctx)
  })
}
