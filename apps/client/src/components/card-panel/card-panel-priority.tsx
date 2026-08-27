import { fallbackCard } from "@doska/core/seed"
import { useCard } from "@doska/core/queries"
import { useUpdateCard } from "@doska/core/mutations"
import { CardPriority } from "../card/priority/card-priority"

/** The open card's priority, editable in the panel header beside its "⋯" menu. */
export function CardPanelPriority({ cardId }: { cardId: string }) {
  const { data: card = fallbackCard } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)

  return (
    <CardPriority
      value={card.priority}
      onChange={(priority) => updateCard({ priority })}
    />
  )
}
