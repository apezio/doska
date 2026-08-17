import { continueList } from "@doska/markdown"
import { useCallback } from "react"

interface Options {
  value: string
  /** Caret as of the last selection report, i.e. before this change. */
  caret: number
  onChangeValue: (value: string) => void
  moveCaret: (caret: number) => void
}

/** True when `next` is `value` with a single newline typed at `caret`. */
function isTypedNewline(value: string, next: string, caret: number): boolean {
  return (
    next.length === value.length + 1 &&
    next[caret] === "\n" &&
    next.slice(0, caret) === value.slice(0, caret) &&
    next.slice(caret + 1) === value.slice(caret)
  )
}

/**
 * Continues Markdown lists on newline, as the web editor does. `TextInput` has
 * no usable key event for Return, so the newline is recognised from the text it
 * produced — which also means autocorrect and paste never trip the rule.
 */
export function useListContinuation({
  value,
  caret,
  onChangeValue,
  moveCaret,
}: Options) {
  return useCallback(
    (next: string) => {
      if (!isTypedNewline(value, next, caret)) {
        onChangeValue(next)
        return
      }

      const continued = continueList(value, caret)
      if (!continued) {
        onChangeValue(next)
        return
      }

      onChangeValue(continued.value)
      moveCaret(continued.caret)
    },
    [value, caret, onChangeValue, moveCaret]
  )
}
