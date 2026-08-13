import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { CardRevealCtx } from "./card-reveal-context"

/** How long the highlight stays on: a flash, not a mode. */
const FLASH_MS = 1200

export function CardRevealProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => clearTimeout(timer.current ?? undefined), [])

  const reveal = useCallback((id: string) => {
    setRevealed(id)
    clearTimeout(timer.current ?? undefined)
    timer.current = setTimeout(() => setRevealed(null), FLASH_MS)

    // The panel opening narrows the board, so scrolling before the next frame
    // lands on the pre-layout position.
    requestAnimationFrame(() => {
      document.querySelector(`[data-rfd-draggable-id="${id}"]`)?.scrollIntoView({
        behavior: "smooth",
        // Lands on the card's title, offset by its `scroll-mt`.
        block: "start",
        inline: "nearest",
      })
    })
  }, [])

  return (
    <CardRevealCtx.Provider value={{ revealed, reveal }}>
      {children}
    </CardRevealCtx.Provider>
  )
}
