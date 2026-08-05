import { WIKILINK_RE } from "@doska/markdown/core"
import { nested, resolves, token, type Context } from "./context"
import type { Token } from "./kinds"

function once(re: RegExp): RegExp {
  return new RegExp(re.source, re.flags.replace("g", ""))
}

interface InlineRule {
  re: RegExp
  tokens(match: RegExpExecArray, ctx: Context): Token[]
}

const RULES: InlineRule[] = [
  {
    // Code comes first so nothing inside a span is parsed as markup.
    re: /`([^`\n]+)`/,
    tokens: ([, body], ctx) => [
      token("`", ctx, "syntax"),
      token(body, ctx, "code"),
      token("`", ctx, "syntax"),
    ],
  },
  {
    re: /(!?)\[([^\]\n]*)\]\(([^)\n]*)\)/,
    tokens: ([, bang, text, url], ctx) => [
      token(`${bang}[`, ctx, "syntax"),
      ...inline(text, nested(ctx, "link")),
      token("](", ctx, "syntax"),
      token(url, ctx, "url"),
      token(")", ctx, "syntax"),
    ],
  },
  {
    re: once(WIKILINK_RE),
    tokens: ([, target, alias], ctx) => [
      token("[[", ctx, "syntax"),
      token(target, ctx, resolves(target, ctx) ? "wikilink" : "brokenWikilink"),
      ...(alias === undefined
        ? []
        : [token("|", ctx, "syntax"), token(alias, ctx)]),
      token("]]", ctx, "syntax"),
    ],
  },
  paired("\\*\\*|__", "strong"),
  paired("~~", "strike"),
  paired("==", "mark"),
  // A lone `*` has to refuse a body containing one, or `*a* and *b*` matches as
  // a single span running from the first delimiter to the last.
  paired("\\*|_", "emphasis", "[^*_\\n]+?"),
]

/**
 * A span fenced by a delimiter repeated on both sides — `**bold**`, `==mark==`.
 * `delimiters` is an alternation, so a kind written more than one way is one
 * rule.
 */
function paired(
  delimiters: string,
  kind: "strong" | "strike" | "mark" | "emphasis",
  body = "[^\\n]+?"
): InlineRule {
  return {
    re: new RegExp(`(${delimiters})(${body})\\1`),
    tokens: ([, fence, inner], ctx) => [
      token(fence, ctx, "syntax"),
      ...inline(inner, nested(ctx, kind)),
      token(fence, ctx, "syntax"),
    ],
  }
}

/** Splits one line's worth of text into tokens, in source order. */
export function inline(text: string, ctx: Context): Token[] {
  const tokens: Token[] = []
  let rest = text

  while (rest) {
    let best: { at: number; rule: InlineRule; match: RegExpExecArray } | null =
      null

    for (const rule of RULES) {
      const match = rule.re.exec(rest)
      if (!match) continue
      if (!best || match.index < best.at)
        best = { at: match.index, rule, match }
    }

    if (!best) break

    if (best.at > 0) tokens.push(token(rest.slice(0, best.at), ctx))
    tokens.push(...best.rule.tokens(best.match, ctx))
    rest = rest.slice(best.at + best.match[0].length)
  }

  if (rest) tokens.push(token(rest, ctx))
  return tokens
}
