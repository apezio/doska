import { Card as CardBase, Checkbox, cn } from "@doska/ui-kit"
import { useState } from "react"
import type { DigestCard } from "@doska/core/operations"
import { useMoveCardToColumn } from "@doska/core/mutations"
import { useDashboardNav } from "@/lib/hooks"
import { ColumnTag } from "../column/column-tag"
import { DoneColumnHelp } from "./done-column-help"

/** Matches the triangle colors in `PriorityChip`, so a row reads the same way. */
const CHECKBOX_BY_PRIORITY: Record<string, string> = {
  high: "border-destructive bg-destructive/10 dark:bg-destructive/20 data-checked:border-destructive/50 data-checked:bg-destructive/50",
  medium:
    "border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 data-checked:border-amber-500/50 data-checked:bg-amber-500/50",
  low: "border-muted-foreground bg-muted-foreground/10 dark:bg-muted-foreground/20 data-checked:border-muted-foreground data-checked:bg-muted-foreground",
}

interface IProps {
  entry: DigestCard
  isActive: boolean
  onOpen: () => void
}

/**
 * One card in the digest
 */
export function DigestRow({ entry, isActive, onOpen }: IProps) {
  const {
    card,
    boardId,
    boardTitle,
    columnTitle,
    columnColor,
    isDone,
    doneColumnId,
    undoneColumnId,
  } = entry
  const { selectDashboard } = useDashboardNav()
  const { mutate: moveCardToColumn } = useMoveCardToColumn()
  const [helpOpen, setHelpOpen] = useState(false)

  const title = card.title || "Untitled card"

  // Null when the board has no done column, and then there is nowhere to send it.
  const target = isDone ? undoneColumnId : doneColumnId

  return (
    <li>
      <CardBase
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return
          e.preventDefault()
          onOpen()
        }}
        className={cn(
          // Overrides the card's stacked layout: a digest card is one line.
          "cursor-pointer flex-row items-center gap-3 rounded-xl px-3",
          "hover:ring-foreground/20",
          isActive && "ring-2 ring-primary/40",
          isDone && "opacity-40"
        )}
      >
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Checkbox
            variant={target ? "default" : "dashed"}
            className={CHECKBOX_BY_PRIORITY[card.priority]}
            checked={isDone}
            readOnly={!target}
            aria-label={
              !target ? "How marking cards done works" : "Toggle done"
            }
            onClick={() => {
              if (!target) setHelpOpen(true)
            }}
            onCheckedChange={() => {
              if (target) moveCardToColumn({ id: card.id, columnId: target })
            }}
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "truncate text-base font-medium",
              isDone && "line-through"
            )}
          >
            {title}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              selectDashboard(boardId)
            }}
            className="self-start truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {boardTitle || "Untitled board"}
          </button>
        </span>
        <span className="flex w-28 shrink-0 justify-end">
          {columnTitle && (
            <ColumnTag
              title={columnTitle}
              color={columnColor}
              isTinted={false}
            />
          )}
        </span>
      </CardBase>
      {!target && (
        <DoneColumnHelp
          open={helpOpen}
          onOpenChange={setHelpOpen}
          boardId={boardId}
          onOpenBoard={() => selectDashboard(boardId)}
        />
      )}
    </li>
  )
}
