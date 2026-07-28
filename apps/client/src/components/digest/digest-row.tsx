import { Card as CardBase, Checkbox, cn } from "@doska/ui-kit"
import { useState } from "react"
import type { DigestCard } from "@/lib/api/operations"
import { useMoveCardToColumn } from "@/lib/data/mutations"
import { useDashboardNav } from "@/lib/hooks"
import { ColumnTag } from "../column/column-tag"
import { DoneColumnHelp } from "./done-column-help"

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
          {columnTitle && <ColumnTag title={columnTitle} color={columnColor} />}
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
