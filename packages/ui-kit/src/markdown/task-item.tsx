import type { MouseEvent, ReactNode } from "react"
import { Checkbox } from "../checkbox"
import { cn } from "../lib/cn"

function stopPropagation(event: MouseEvent) {
  event.stopPropagation()
}

/**
 * A GFM task-list item. A "loose" list wraps each item's content in a `<p>`
 * while a "tight" one puts it straight in the `<li>`; the first paragraph goes
 * inline so the checkbox — its sibling, not its child — stays on the same line.
 */
export function MdTaskItem({
  checked,
  onToggle,
  label,
  children,
}: {
  checked: boolean
  /** Absent when the checkbox is not interactive. */
  onToggle?: () => void
  label?: string
  children: ReactNode
}) {
  return (
    <li
      className={cn(
        "my-[0.2rem] -ml-4 list-none",
        "[&>p]:m-0 [&>p:first-of-type]:inline",
        checked && "text-muted-foreground"
      )}
    >
      {/* The item may sit inside a card's open-detail handler. */}
      <span className="contents" onClick={stopPropagation}>
        <Checkbox
          aria-label={label ?? "Checkbox"}
          checked={checked}
          readOnly={!onToggle}
          className={cn(
            "-mt-0.5 mr-1.5 inline-flex align-middle",
            onToggle && "cursor-pointer"
          )}
          onCheckedChange={onToggle}
        />
      </span>
      {children}
    </li>
  )
}
