import { useLocation } from "wouter"
import { useCardRef } from "@doska/core/card-refs"
import { columnHue, MdWikilink } from "@doska/ui-kit"
import { routes } from "@/lib/routes"
import { useDeck } from "../../deck/deck-context"

/**
 * A `[[ROAD-12]]` reference rendered inside a card body: the card's id, then
 * its title, then a pill for the column it sits in, tinted with that
 * column's color.
 */
export function CardRefLink({
  displayId,
  alias,
}: {
  displayId: string
  alias?: string
}) {
  const [, navigate] = useLocation()
  const { id: deckId, prefix } = useDeck()
  const ref = useCardRef(deckId, prefix, displayId)

  if (!ref)
    return (
      <MdWikilink
        target={displayId}
        label={alias}
        unresolved
        title="No such card"
      />
    )

  const { card, columnTitle, columnColor } = ref
  const title = alias || card.title || "Untitled card"

  return (
    <MdWikilink
      target={displayId}
      label={title}
      badge={columnTitle || undefined}
      hue={columnHue(columnColor)}
      title={columnTitle ? `${title} — ${columnTitle}` : title}
      onOpen={() => navigate(routes.card.to(card.id))}
    />
  )
}
