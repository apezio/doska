import { cn } from "@doska/ui-kit"
import { useEffect, type CSSProperties, type ReactNode } from "react"
import { PanelResizeHandle } from "./panel-resize-handle"
import { usePanelResize } from "./use-panel-resize"

interface IProps {
  isOpen: boolean
  onClose: () => void
  /** Clears the card once the closing sweep has finished. */
  onClosed: () => void
  children: ReactNode
}

/** The panel itself: resizable beside the board, full-screen on a phone. */
export function CardPanelShell({
  isOpen,
  onClose,
  onClosed,
  children,
}: IProps) {
  const { width, isResizing, startResizing, resetWidth } = usePanelResize()

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose])

  return (
    <div
      style={{ "--card-panel-width": `${width}px` } as CSSProperties}
      className={cn(
        "relative shrink-0 overflow-hidden",
        // Pinned to the *visual* viewport, not the layout one
        "max-md:fixed max-md:inset-x-0 max-md:z-50 max-md:w-full max-md:bg-card",
        "max-md:top-(--app-offset,0px) max-md:h-(--app-height,100svh)",
        "md:box-border",
        // Resizing must track the pointer, so only the open/close sweep animates.
        !isResizing && "md:transition-[width] md:duration-200 md:ease-linear",
        // The padding is the handle's gutter, so the width covers both.
        isOpen
          ? "md:w-[calc(var(--card-panel-width)+1rem)] md:p-2"
          : "max-md:hidden md:w-0"
      )}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !isOpen) onClosed()
      }}
    >
      {isOpen && (
        <PanelResizeHandle
          isResizing={isResizing}
          onStartResizing={startResizing}
          onResetWidth={resetWidth}
        />
      )}
      {/* `ring-inset` because the wrapper's overflow clips an outset ring's left edge. */}
      <div
        role="region"
        aria-label="Card"
        className="flex h-full w-full flex-col overflow-hidden bg-card text-sm text-card-foreground md:w-(--card-panel-width) md:rounded-xl md:ring-1 md:ring-foreground/10 md:ring-inset"
      >
        {children}
      </div>
    </div>
  )
}
