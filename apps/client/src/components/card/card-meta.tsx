import { CardId, TaskIndicator, cn } from "@doska/ui-kit"
import { cardDisplayId } from "@doska/contract/prefix"
import { taskProgress } from "@doska/markdown"
import type { Card, Column } from "@doska/core/types"
import { CardDeadline } from "./deadline/card-deadline"

interface IProps {
  card: Card
  /** The column the card sits in — a card in the done column reads as finished. */
  column?: Column | null
  prefix: string
  /** The unsaved body, for callers holding a draft — task progress tracks it live. */
  body?: string
  /** Omit to show the deadline without a picker. */
  onChangeDeadline?: (deadline: string | null) => void
  className?: string
}

/** A card's id, task progress and deadline — on the board card and in its panel. */
export function CardMeta({
  card,
  column,
  prefix,
  body,
  onChangeDeadline,
  className,
}: IProps) {
  const displayId = cardDisplayId(prefix, card.number)
  const { done, total } = taskProgress(body ?? card.body)

  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      {displayId && <CardId id={displayId} />}
      {total > 0 && <TaskIndicator done={done} total={total} />}
      <CardDeadline
        done={column?.done ?? false}
        value={card.deadline}
        onChange={onChangeDeadline}
      />
    </div>
  )
}
