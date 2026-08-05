/**
 * One styling role a run of source text can carry.
 */
export type TokenKind =
  /** Punctuation that exists only to mark up: `#`, `**`, backticks, `[[`. */
  | "syntax"
  | "heading"
  | "strong"
  | "emphasis"
  | "strike"
  | "mark"
  /** The visible text of a `[label](url)` link. */
  | "link"
  /** The url half of one. */
  | "url"
  /** A `[[target]]` that names a real card. */
  | "wikilink"
  /** A `[[target]]` that names nothing. */
  | "brokenWikilink"
  | "quote"
  /** The text of a ticked task. */
  | "done"
  /** The `-cut-` line. */
  | "cut"
  /** Inline code and the body of a fenced block. */
  | "code"

/**
 * A run of source text and every kind that applies to it, outermost first —
 * a `**bold**` inside a heading yields `["heading", "strong"]`.
 */
export interface Token {
  text: string
  kinds: TokenKind[]
}

/** Looks a token's kinds up in a platform's palette, in order. */
export function tokenStyles<T>(
  token: Token,
  theme: Partial<Record<TokenKind, T>>
): T[] {
  const styles: T[] = []
  for (const kind of token.kinds) {
    const style = theme[kind]
    if (style !== undefined) styles.push(style)
  }
  return styles
}
