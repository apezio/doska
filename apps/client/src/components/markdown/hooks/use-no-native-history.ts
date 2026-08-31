import { useEffect } from "react"

/**
 * Turns off the browser's own undo stack for a textarea. Against a controlled
 * React value that stack is not dependable in the first place — it restores
 * text the app never hears about — and where the app keeps its own history the
 * two of them fight over the same keystroke. Blocked at `beforeinput`, which
 * catches the Edit menu, the context menu and iOS shake-to-undo as well as the
 * shortcut.
 *
 * A browser that declines to fire the event leaves the native undo to land as
 * an ordinary edit: still recorded, still undoable, never lost.
 */
export function useNoNativeHistory(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  enabled = true
) {
  useEffect(() => {
    const textarea = ref.current
    if (!textarea || !enabled) return

    const onBeforeInput = (e: Event) => {
      const { inputType } = e as InputEvent
      if (inputType === "historyUndo" || inputType === "historyRedo")
        e.preventDefault()
    }

    textarea.addEventListener("beforeinput", onBeforeInput)
    return () => textarea.removeEventListener("beforeinput", onBeforeInput)
  }, [ref, enabled])
}
