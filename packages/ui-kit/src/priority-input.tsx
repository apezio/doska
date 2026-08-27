import { useState, type KeyboardEvent } from "react"
import { priorityBand } from "@doska/tokens/priority"
import { cn } from "./lib/cn"

const TEXT_BY_BAND: Record<string, string> = {
  high: "text-destructive",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-muted-foreground",
}

/** Digits only, at most three — 100 is as long as a priority gets. */
function sanitize(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 3)
}

interface IProps {
  value: number
  /** Omit to render the number read-only. */
  onChange?: (value: number) => void
  min?: number
  max?: number
  className?: string
}

/**
 * A card's priority as an editable number: click it, type, press Enter. Both
 * states occupy the same small box, so nothing around it moves — it is meant
 * to sit in a card's title row beside the "⋯" menu.
 *
 * An empty entry means no priority, which shows as a dash rather than a 0.
 */
export function PriorityInput({
  value,
  onChange,
  min = 0,
  max = 100,
  className,
}: IProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const band = priorityBand(value)
  const label = `Priority: ${value || "none"}`

  const box = cn(
    "h-5 w-[3.25ch] shrink-0 rounded text-right font-mono text-xs tabular-nums",
    band ? TEXT_BY_BAND[band] : "text-muted-foreground/60",
    className
  )

  const commit = (raw: string | null) => {
    setDraft(null)
    if (raw === null) return
    const next = raw === "" ? 0 : Math.min(max, Math.max(min, Number(raw)))
    if (next !== value) onChange?.(next)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    }
    if (e.key === "Escape") {
      e.preventDefault()
      setDraft(null)
    }
  }

  if (draft !== null) {
    return (
      <input
        // Opened by a click on the number it replaces, so the caret belongs here.
        autoFocus
        aria-label="Card priority"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(sanitize(e.target.value))}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={onKeyDown}
        onBlur={(e) => commit(sanitize(e.target.value))}
        className={cn(
          box,
          "bg-transparent px-0 text-foreground outline-none",
          "ring-1 ring-primary/60"
        )}
      />
    )
  }

  if (!onChange) {
    return (
      <span aria-label={label} className={cn(box, "inline-block leading-5")}>
        {value || "–"}
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-label="Card priority"
      title={`Priority ${value || "unset"} — click to edit (0–100)`}
      onClick={() => setDraft(value ? String(value) : "")}
      className={cn(box, "cursor-text hover:text-foreground")}
    >
      {value || "–"}
    </button>
  )
}
