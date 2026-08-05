import { cn } from "@doska/ui-kit"
import { tokenStyles, tokenizeMarkdown, type Token } from "@doska/highlight"
import type { WikilinkOption } from "@doska/markdown"
import { Fragment, useMemo } from "react"
import { TOKEN_CLASSES } from "./theme"

interface IProps {
  value: string
  /** The textarea's own type and box classes, so both lay text out identically. */
  className?: string
  /** Wikilink targets that resolve; without them every reference reads as live. */
  wikilinks?: WikilinkOption[]
}

function Run({ token }: { token: Token }) {
  const className = tokenStyles(token, TOKEN_CLASSES).join(" ")
  if (!className) return token.text
  return <span className={className}>{token.text}</span>
}

/**
 * Paints the textarea's text a second time, behind it, with syntax styled. The
 * textarea keeps the caret and selection and renders its own text transparent.
 */
export function HighlightOverlay({ value, className, wikilinks }: IProps) {
  const targets = useMemo(
    () => wikilinks?.map((option) => option.target),
    [wikilinks]
  )
  const lines = useMemo(
    () => tokenizeMarkdown(value, { targets }),
    [value, targets]
  )

  return (
    <pre
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        "wrap-break-word whitespace-pre-wrap",
        className
      )}
    >
      {lines.map((tokens, index) => (
        <Fragment key={index}>
          {index > 0 && "\n"}
          {tokens.map((token, run) => (
            <Run key={run} token={token} />
          ))}
        </Fragment>
      ))}
    </pre>
  )
}
