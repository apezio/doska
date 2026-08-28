/** True on macOS, where the shortcut modifier reads ⌘ rather than "Ctrl". */
export function isMac(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent.includes("Mac")
}

/** Display form of a modifier shortcut: "⌘K" on macOS, "Ctrl+K" elsewhere. */
export function shortcutLabel(key: string): string {
  return isMac() ? `⌘${key}` : `Ctrl+${key}`
}
