import { cn, Hint } from "@doska/ui-kit"
import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from "@doska/core/column-widths"

/** One arrow-key press, and the coarse step Shift asks for. */
const STEP = 16
const COARSE_STEP = 64

interface IProps {
  /** Names the column the handle belongs to, for its accessible name. */
  title: string
  width: number
  isResizing: boolean
  onStartResizing: (clientX: number) => void
  onNudge: (delta: number) => void
  onReset: () => void
}

/**
 * The grab strip on a column's right edge. It sits in the gutter between
 * columns rather than over the column, so it never covers a card and never
 * swallows the pointer-down that starts a card drag.
 */
export function ColumnResizeHandle({
  title,
  width,
  isResizing,
  onStartResizing,
  onNudge,
  onReset,
}: IProps) {
  return (
    <Hint
      label="Drag to resize · double-click to reset"
      side="right"
      disabled={isResizing}
    >
      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label={`Resize ${title}`}
        aria-valuenow={width}
        aria-valuemin={MIN_COLUMN_WIDTH}
        aria-valuemax={MAX_COLUMN_WIDTH}
        onPointerDown={(e) => {
          // Keeps the drag from turning into a text selection, and keeps the
          // board's drag sensors out of it.
          e.preventDefault()
          e.stopPropagation()
          onStartResizing(e.clientX)
        }}
        onDoubleClick={onReset}
        onKeyDown={(e) => {
          const step = e.shiftKey ? COARSE_STEP : STEP
          if (e.key === "ArrowLeft") onNudge(-step)
          else if (e.key === "ArrowRight") onNudge(step)
          else if (e.key === "Home" || e.key === "End") onReset()
          else return
          e.preventDefault()
        }}
        className={cn(
          // The gutter is the board's `xs:gap-6`; below `xs` columns are
          // full-width and snap, so there is no gutter and no handle.
          "absolute inset-y-0 -right-6 z-20 hidden w-6 xs:block",
          "cursor-col-resize touch-none",
          "after:absolute after:inset-y-4 after:left-1/2 after:w-1",
          "after:-translate-x-1/2 after:rounded-full after:bg-primary/50",
          "after:opacity-0 after:transition-opacity",
          isResizing ? "after:opacity-100" : "hover:after:opacity-100",
          "focus-visible:outline-none focus-visible:after:opacity-100"
        )}
      />
    </Hint>
  )
}
