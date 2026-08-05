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

export function resolves(target: string, ctx: Context): boolean {
  return ctx.targets.size === 0 || ctx.targets.has(target.trim().toLowerCase())
}
