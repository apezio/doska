import { DARK, LIGHT, type ThemeTokens } from "@doska/tokens"
import { useColorScheme } from "nativewind"

export interface Tokens extends ThemeTokens {
  dark: boolean
  /** The column head's tint over its blur */
  headVeil: string
  /** {@link headVeil}'s counterpart over the card sheet's `--card` surface. */
  cardVeil: string
}

const LIGHT_TOKENS: Tokens = {
  ...LIGHT,
  dark: false,
  headVeil: "#f7f7facc",
  cardVeil: "#ffffffcc",
}

const DARK_TOKENS: Tokens = {
  ...DARK,
  dark: true,
  headVeil: "#232939cc",
  cardVeil: "#2d3447cc",
}

export function useTokens(): Tokens {
  return useColorScheme().colorScheme === "dark" ? DARK_TOKENS : LIGHT_TOKENS
}
