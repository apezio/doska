import { colorScheme, useColorScheme } from "nativewind"
import { mobileKeyValue } from "./adapters/mobile-kv"

/** The same key the web client stores its choice under. */
const THEME_KEY = "theme"

export type Theme = "light" | "dark"

function stored(): Theme | null {
  const value = mobileKeyValue.get(THEME_KEY)
  return value === "light" || value === "dark" ? value : null
}

/**
 * Applies the stored override before the first render, so a chosen theme does
 * not flash the device's one on the way in. With nothing stored, "system" is
 * what NativeWind is already doing — the media query in `global.css`.
 */
export function restoreTheme(): void {
  colorScheme.set(stored() ?? "system")
}

export function useTheme(): { theme: Theme; setTheme: (next: Theme) => void } {
  const { colorScheme: scheme, setColorScheme } = useColorScheme()

  return {
    theme: scheme ?? "light",
    setTheme: (next) => {
      mobileKeyValue.set(THEME_KEY, next)
      setColorScheme(next)
    },
  }
}
