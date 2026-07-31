import { useColorScheme } from "react-native"

export interface MarkdownTheme {
  dark: boolean
  text: string
  muted: string
  border: string
  codeBg: string
  quoteBar: string
  markBg: string
  markFg: string
  linkFg: string
  chipBg: string
  chipFg: string
}

const LIGHT: MarkdownTheme = {
  dark: false,
  text: "#171717",
  muted: "#737373",
  border: "#e5e5e5",
  codeBg: "#f5f5f5",
  quoteBar: "#d4d4d4",
  markBg: "#fef08a",
  markFg: "#171717",
  linkFg: "#2563eb",
  chipBg: "#f5f5f5",
  chipFg: "#525252",
}

const DARK: MarkdownTheme = {
  dark: true,
  text: "#f5f5f5",
  muted: "#a3a3a3",
  border: "#262626",
  codeBg: "#171717",
  quoteBar: "#404040",
  markBg: "#854d0e",
  markFg: "#fef9c3",
  linkFg: "#60a5fa",
  chipBg: "#262626",
  chipFg: "#a3a3a3",
}

export function useMarkdownTheme(): MarkdownTheme {
  return useColorScheme() === "dark" ? DARK : LIGHT
}
