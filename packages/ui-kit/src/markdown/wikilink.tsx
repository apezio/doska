import type { CSSProperties, KeyboardEvent, MouseEvent } from "react"
import { cn } from "../lib/cn"

interface IProps {
  /** The raw `[[target]]`, e.g. `ROAD-12`. */
  target: string
  /** What to show for the target — either resolved, or written into the text. */
  label?: string
  /** The target names no real card, whatever label the text gave it. */
  unresolved?: boolean
  /** Trailing detail — a status, a category. */
  badge?: string
  /** oklch hue tinting the badge; neutral without one. */
  hue?: number | null
  title?: string
  onOpen?: () => void
}

const SEGMENT =
  "inline box-decoration-clone bg-muted px-[0.5em] py-[0.15em] text-muted-foreground"

/**
 * A `[[target]]` reference
 */
export function MdWikilink({
  target,
  label,
  unresolved,
  badge,
  hue,
  title,
  onOpen,
}: IProps) {
  const activate = (e: MouseEvent | KeyboardEvent) => {
    if (!onOpen) return
    e.preventDefault()
    // The chip sits inside the board card's own open-detail handler.
    e.stopPropagation()
    onOpen()
  }

  if (unresolved || !label)
    return (
      <span
        className="wikilink inline text-[0.9em] leading-[1.6] not-italic"
        title={title}
      >
        <span className="wikilink-target inline text-muted-foreground underline decoration-dashed underline-offset-2">
          {label ? `${target} — ${label}` : target}
        </span>
      </span>
    )

  return (
    <span
      role={onOpen ? "link" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      title={title}
      onClick={onOpen && activate}
      onKeyDown={
        onOpen &&
        ((e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") activate(e)
        })
      }
      className={cn(
        "wikilink inline text-[0.9em] leading-[1.6] not-italic",
        "transition-[filter] duration-150",
        "hover:brightness-[0.96] hover:saturate-[1.1] dark:hover:brightness-[1.15]",
        onOpen && "cursor-pointer"
      )}
    >
      {/* The target and the label share a background, so the padding facing
          each other reads as one wide gap — both sides of that seam are
          tightened so all three segments look evenly set. */}
      <span
        className={cn(
          SEGMENT,
          "wikilink-target rounded-l-[0.5em] pr-[0.3em] whitespace-nowrap"
        )}
      >
        {target}
      </span>
      {/* The label is the reference's subject, so it gets the readable
          foreground — the target and the badge stay muted around it. */}
      <span
        className={cn(
          SEGMENT,
          "wikilink-label pl-[0.3em] font-semibold text-card-foreground",
          !badge && "rounded-r-[0.5em]"
        )}
      >
        {label}
      </span>
      {badge && (
        <span
          className={cn(
            SEGMENT,
            "wikilink-badge rounded-r-[0.5em] tracking-[0.02em] uppercase",
            hue != null &&
              "bg-[var(--wikilink-bg)] text-[var(--wikilink-fg)] dark:bg-[var(--wikilink-bg-dark)] dark:text-[var(--wikilink-fg-dark)]"
          )}
          style={
            hue == null
              ? undefined
              : ({
                  "--wikilink-bg": `oklch(0.95 0.05 ${hue})`,
                  "--wikilink-fg": `oklch(0.44 0.13 ${hue})`,
                  "--wikilink-bg-dark": `oklch(0.62 0.14 ${hue} / 0.24)`,
                  "--wikilink-fg-dark": `oklch(0.84 0.11 ${hue})`,
                } as CSSProperties)
          }
        >
          {badge}
        </span>
      )}
    </span>
  )
}
