import { cn } from "@doska/ui-kit"
import { useEffect, type CSSProperties, type ReactNode } from "react"
import { useReportResizing } from "../deck/resize-state"
import { ColumnResizeHandle } from "./column-resize-handle"
import { useColumnResize } from "./use-column-resize"

interface IProps {
  /** The column's id — what its remembered width is filed under. */
  id: string
  title: string
  children: ReactNode
}

/**
 * A column's outer frame: it owns the column's width, the strip that drags it,
 * and the scrolling box the column's own content sits in.
 *
 * The width lives here rather than in {@link ColumnView} so a drag re-renders
 * only the frame — the head and the cards below are the same elements
 * throughout, and a board full of cards stays smooth under the pointer.
 *
 * Below `xs` the width is ignored: there, columns are full-screen and snap, and
 * a phone has no gutter to drag anyway.
 */
export function ColumnFrame({ id, title, children }: IProps) {
  const { width, isResizing, onStartResizing, onNudge, onReset } =
    useColumnResize(id)

  // The board suppresses snap scrolling while this is true — snapping fights a
  // drag on a column edge exactly as it fights a card drag. The cleanup clears
  // it whichever way the drag ends, including an unmount mid-drag.
  const reportResizing = useReportResizing()
  useEffect(() => {
    if (!isResizing) return
    reportResizing(true)
    return () => reportResizing(false)
  }, [isResizing, reportResizing])

  return (
    <div
      role="group"
      aria-label={title}
      style={{ "--column-width": `${width}px` } as CSSProperties}
      className="relative flex w-full shrink-0 snap-center flex-col xs:w-(--column-width)"
    >
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain pb-6",
          isResizing && "select-none"
        )}
      >
        {children}
      </div>
      <ColumnResizeHandle
        title={title}
        width={width}
        isResizing={isResizing}
        onStartResizing={onStartResizing}
        onNudge={onNudge}
        onReset={onReset}
      />
    </div>
  )
}
