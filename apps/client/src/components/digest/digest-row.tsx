import {
  Card as CardBase,
  Checkbox,
  PriorityDot,
  TaskIndicator,
  cn,
} from "@doska/ui-kit"
import { useState } from "react"
import type { DigestCard } from "@doska/core/operations"
import { taskProgress } from "@doska/markdown"
import { useMoveCardToColumn } from "@doska/core/mutations"
import { useDashboardNav } from "@/lib/hooks"
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
    isDone,
    doneColumnId,
    undoneColumnId,
  } = entry
  const { selectDashboard } = useDashboardNav()
  const { mutate: moveCardToColumn } = useMoveCardToColumn()
  const [helpOpen, setHelpOpen] = useState(false)

  const title = card.title || "Untitled card"
  const tasks = taskProgress(card.body)

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
              "inline-flex min-w-0 items-center gap-2 truncate text-base font-medium",
              isDone && "line-through"
            )}
          >
            <span className="truncate">{title}</span>
            <PriorityDot value={card.priority} />
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              selectDashboard(boardId)
            }}
            className="self-start truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {boardTitle || "Untitled board"} · {columnTitle}
          </button>
        </span>
        {tasks.total > 0 && <TaskIndicator {...tasks} />}
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
