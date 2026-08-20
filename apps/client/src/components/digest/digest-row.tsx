import {
  Card as CardBase,
  Checkbox,
  PriorityDot,
  TaskIndicator,
  cn,
} from "@doska/ui-kit"
import type { DigestCard } from "@doska/core/operations"
import { taskProgress } from "@doska/markdown"

interface IProps {
  entry: DigestCard
  isActive: boolean
  /** Off inside a single board, where every row names the same board. */
  showBoard?: boolean
  /** False when the board has no done column: the checkbox explains instead. */
  canToggleDone: boolean
  onOpen: () => void
  onToggleDone: () => void
  onOpenBoard: () => void
}

/** One card in the digest. */
export function DigestRow({
  entry,
  isActive,
  showBoard = true,
  canToggleDone,
  onOpen,
  onToggleDone,
  onOpenBoard,
}: IProps) {
  const { card, boardTitle, columnTitle, isDone } = entry

  const title = card.title || "Untitled card"
  const tasks = taskProgress(card.body)

  return (
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
          variant={canToggleDone ? "default" : "dashed"}
          checked={isDone}
          readOnly={!canToggleDone}
          aria-label={
            canToggleDone ? "Toggle done" : "How marking cards done works"
          }
          // A read-only box never reports a change, so the explaining case has
          // to come off the click instead.
          onClick={() => {
            if (!canToggleDone) onToggleDone()
          }}
          onCheckedChange={() => {
            if (canToggleDone) onToggleDone()
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
        {showBoard ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenBoard()
            }}
            className="self-start truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {boardTitle || "Untitled board"} · {columnTitle}
          </button>
        ) : (
          <span className="self-start truncate text-sm text-muted-foreground">
            {columnTitle}
          </span>
        )}
      </span>
      {tasks.total > 0 && <TaskIndicator {...tasks} />}
    </CardBase>
  )
}
