import { fallbackCard } from "@doska/core/seed"
import { useCard, useCardCol } from "@doska/core/queries"
import { useUpdateCard } from "@doska/core/mutations"
import { useDeckPrefix } from "@/providers/deck/deck-context"
import { CardMeta } from "./card-meta"

interface IProps {
  cardId: string
  /** The unsaved body, for callers holding a draft. */
  body?: string
  className?: string
}

/** `CardMeta` for a card the viewer can edit: reads it live, writes edits back. */
export function CardMetaLive({ cardId, body, className }: IProps) {
  const prefix = useDeckPrefix()
  const { data: card = fallbackCard } = useCard(cardId)
  const { data: column } = useCardCol(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)

  return (
    <CardMeta
      showEmpty
      card={card}
      column={column}
      prefix={prefix}
      body={body}
      onChangeDeadline={(deadline) => updateCard({ deadline })}
      onChangePriority={(priority) => updateCard({ priority })}
      className={className}
    />
  )
}
