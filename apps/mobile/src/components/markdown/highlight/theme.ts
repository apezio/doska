import type { TokenKind } from "@doska/highlight"
import type { Tokens } from "@doska/ui-kit-mobile/tokens"
import type { TextStyle } from "react-native"

/**
 * What each token kind looks like in the editor overlay.
 *
 * Only what leaves the glyphs where they were: color, decoration, and the
 * medium weight of the same monospace family. Italic and synthetic bold are
 * deliberately absent — iOS answers either by falling back to a proportional
 * system face, which slides the text out from under the caret.
 */
export function tokenTextStyles(
  tokens: Tokens
): Partial<Record<TokenKind, TextStyle>> {
  const faint = tokens.dark ? "#ffffff66" : "#00000066"

  return {
    syntax: { color: faint },
    heading: { fontFamily: "GeistMono_500Medium" },
    strong: { fontFamily: "GeistMono_500Medium" },
    strike: { textDecorationLine: "line-through" },
    mark: { backgroundColor: "#9b7cf14d" },
    link: { color: tokens.primary },
    url: { color: faint },
    wikilink: { color: tokens.primary },
    brokenWikilink: {
      color: tokens.mutedForeground,
      textDecorationLine: "underline",
    },
    quote: { color: tokens.mutedForeground },
    done: { color: tokens.mutedForeground },
    cut: { color: faint },
  }
}
