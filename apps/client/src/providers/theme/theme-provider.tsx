import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ThemeCtx, type Theme } from "./theme-context"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

const THEME_VALUES: Theme[] = ["dark", "light"]

function isTheme(value: string | null): value is Theme {
  return !!value && THEME_VALUES.includes(value as Theme)
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey)
    return isTheme(storedTheme) ? storedTheme : defaultTheme
  })

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      localStorage.setItem(storageKey, nextTheme)
      setThemeState(nextTheme)
    },
    [storageKey]
  )

  const applyTheme = useCallback((nextTheme: Theme) => {
    const root = document.documentElement

    root.classList.remove("light", "dark")
    root.classList.add(nextTheme)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) {
        return
      }

      if (event.key !== storageKey) {
        return
      }

      if (isTheme(event.newValue)) {
        setThemeState(event.newValue)
        return
      }

      setThemeState(defaultTheme)
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [defaultTheme, storageKey])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme]
  )

  return (
    <ThemeCtx.Provider {...props} value={value}>
      {children}
    </ThemeCtx.Provider>
  )
}
