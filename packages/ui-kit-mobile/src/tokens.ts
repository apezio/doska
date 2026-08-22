import { DARK, LIGHT, type ThemeTokens } from "@doska/tokens"
import { useColorScheme } from "nativewind"

export interface Tokens extends ThemeTokens {
  dark: boolean
  /** The column head's tint over its blur */
  headVeil: string
  /** {@link headVeil}'s counterpart over the card sheet's `--card` surface. */
  cardVeil: string
  /** `--elevation-1` as a `boxShadow`. The CSS variable cannot be reached from
   * a native style prop, and Tailwind's `shadow-*` keeps only one layer. */
  elevation1: string
}

const LIGHT_TOKENS: Tokens = {
  ...LIGHT,
  dark: false,
  headVeil: "#f7f7facc",
  cardVeil: "#ffffffcc",
  elevation1: "0 1px 2px -1px #343c5414, 0 3px 8px -3px #343c5417",
}

const DARK_TOKENS: Tokens = {
  ...DARK,
  dark: true,
  headVeil: "#232939cc",
  cardVeil: "#282e3fcc",
  elevation1: "0 1px 2px -1px #0d101a57, 0 3px 8px -3px #0d101a52",
}

export function useTokens(): Tokens {
  return useColorScheme().colorScheme === "dark" ? DARK_TOKENS : LIGHT_TOKENS
}
