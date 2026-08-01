import { useColorScheme } from "nativewind"

/**
 * The same tokens as `global.css`, for the props that take a colour value
 * rather than a class — `placeholderTextColor` and friends. Prefer the
 * `bg-*` / `text-*` classes; reach for this only where React Native gives you
 * nowhere to put one.
 *
 * Kept in step with `global.css` by hand: NativeWind resolves its variables
 * inside the style system, so there is nothing to read them back out of.
 */
export interface Tokens {
  dark: boolean
  background: string
  foreground: string
  card: string
  cardForeground: string
  primary: string
  primaryForeground: string
  muted: string
  mutedForeground: string
  border: string
  destructive: string
  sidebar: string
  /**
   * The column head's tint over its blur: the web's `bg-background/80` taken
   * over the mobile board's `--sidebar` surface. Value-only — it has no class,
   * because BlurView is styled by value.
   */
  headVeil: string
}

const LIGHT: Tokens = {
  dark: false,
  background: "#f7f7fa",
  foreground: "#343c54",
  card: "#ffffff",
  cardForeground: "#343c54",
  primary: "#725cff",
  primaryForeground: "#ffffff",
  muted: "#f7f7f8",
  mutedForeground: "#676d7f",
  border: "#eeeff2",
  destructive: "#ff5656",
  sidebar: "#ffffff",
  headVeil: "#ffffffcc",
}

const DARK: Tokens = {
  dark: true,
  background: "#232939",
  foreground: "#f7f7f8",
  card: "#2d3447",
  cardForeground: "#f7f7f8",
  primary: "#9585ff",
  primaryForeground: "#f7f7f8",
  muted: "#343c54",
  mutedForeground: "#999da9",
  border: "#ffffff1f",
  destructive: "#ff5656",
  sidebar: "#1d2230",
  headVeil: "#1d2230cc",
}

// NativeWind's scheme, not React Native's: the theme toggle overrides the
// device one, and these values have to follow the classes.
export function useTokens(): Tokens {
  return useColorScheme().colorScheme === "dark" ? DARK : LIGHT
}
