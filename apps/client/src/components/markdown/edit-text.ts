/**
 * Applying an edit by writing the controlled value to keep the native undo stack
 */
export function replaceRange(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string
): boolean {
  textarea.focus()
  textarea.setSelectionRange(start, end)
  if (text === "") return start === end || document.execCommand("delete")
  return document.execCommand("insertText", false, text)
}

export function applyEdit(
  textarea: HTMLTextAreaElement,
  next: string
): boolean {
  const current = textarea.value
  if (current === next) return true

  const max = Math.min(current.length, next.length)
  let start = 0
  while (start < max && current[start] === next[start]) start++

  let end = 0
  while (
    end < max - start &&
    current[current.length - 1 - end] === next[next.length - 1 - end]
  )
    end++

  return replaceRange(
    textarea,
    start,
    current.length - end,
    next.slice(start, next.length - end)
  )
}
