import { continueList } from "@doska/markdown"
import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

interface Options {
  value: string
  onChangeValue: (value: string) => void
  enabled?: boolean
}

/**
 * Continues Markdown lists when Enter is pressed inside a list item. With a
 * selection, or on a non-list line, the browser's native newline is left
 * untouched.
 */
export function useListContinuation(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  { value, onChangeValue, enabled = true }: Options
) {
  const pendingCaret = useRef<number | null>(null)

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey)
        return
      const textarea = ref.current
      if (!textarea || textarea.selectionStart !== textarea.selectionEnd) return

      const next = continueList(textarea.value, textarea.selectionStart)
      if (!next) return

      e.preventDefault()
      onChangeValue(next.value)
      pendingCaret.current = next.caret
    },
    [ref, onChangeValue]
  )

  useEffect(() => {
    const textarea = ref.current
    if (!textarea || !enabled) return
    textarea.addEventListener("keydown", onKeyDown)
    return () => textarea.removeEventListener("keydown", onKeyDown)
  }, [ref, enabled, onKeyDown])

  // Restore the caret once the controlled value update lands.
  useLayoutEffect(() => {
    if (pendingCaret.current === null) return
    const textarea = ref.current
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(pendingCaret.current, pendingCaret.current)
    }
    pendingCaret.current = null
  }, [ref, value])
}
