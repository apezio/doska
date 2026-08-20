import type { Token, TokenKind } from "./kinds"

export interface Context {
  /** Wikilink targets that resolve to a real card, lowercased. */
  targets: Set<string>
  /** Kinds the enclosing blocks and spans already apply, outermost first. */
  base: readonly TokenKind[]
}

export function nested(ctx: Context, kind: TokenKind): Context {
  return { ...ctx, base: [...ctx.base, kind] }
}

/** A token carrying the enclosing kinds plus, optionally, one of its own. */
export function token(text: string, ctx: Context, kind?: TokenKind): Token {
  return { text, kinds: kind ? [...ctx.base, kind] : [...ctx.base] }
}

/**
 * A target reduced to what it points at, for both sides of the lookup. Card ids used to carry a board prefix,
 * and a `[[ROAD-12]]` written back then still resolves to card 12 — so the
 * editor must not paint it broken.
 */
export function normalize(target: string): string {
  const text = target.trim().toLowerCase()
  return text.slice(text.indexOf("-") + 1)
}

export function resolves(target: string, ctx: Context): boolean {
  return ctx.targets.size === 0 || ctx.targets.has(normalize(target))
}
