import type { TokenKind } from "@doska/highlight"

/**
 * What each token kind looks like in the editor overlay.
 * Only color, weight, and decoration belong here.
 */
export const TOKEN_CLASSES: Partial<Record<TokenKind, string>> = {
  syntax: "text-muted-foreground/60",
  heading: "font-bold",
  strong: "font-semibold",
  emphasis: "italic",
  strike: "line-through",
  mark: "rounded-[0.2em] bg-[oklch(0.69_0.17_286.88_/_0.3)]",
  link: "text-primary",
  url: "text-muted-foreground/60",
  wikilink: "text-primary",
  brokenWikilink: "text-muted-foreground underline decoration-dashed",
  quote: "text-muted-foreground italic",
  done: "text-muted-foreground",
  cut: "text-muted-foreground/60",
}
