import { useLocation } from "wouter"
import { cardDisplayId } from "@doska/contract/prefix"
import { columnHue, MdWikilink } from "@doska/ui-kit"
import type { Card, Column } from "@doska/core/types"
import { routes } from "@/lib/routes"

interface IProps {
  displayId: string
  alias?: string
  prefix: string
  cards: Card[]
  columns: Column[]
}

/**
 * A `[[ROAD-12]]` reference resolved against the snapshot. A reference to a card
 * on another board is unresolved here by construction — the payload only ever
 * holds this one board.
 */
export function PublicCardRefLink({
  displayId,
  alias,
  prefix,
  cards,
  columns,
}: IProps) {
  const [, navigate] = useLocation()

  const wanted = displayId.trim().toLowerCase()
  const card = cards.find(
    (one) => cardDisplayId(prefix, one.number)?.toLowerCase() === wanted
  )

  if (!card)
    return (
      <MdWikilink
        target={displayId}
        label={alias}
        unresolved
        title="No such card"
      />
    )

  const column = columns.find((one) => one.id === card.columnId)
  const title = alias || card.title || "Untitled card"
  const columnTitle = column?.title ?? ""

  return (
    <MdWikilink
      target={displayId}
      label={title}
      badge={columnTitle || undefined}
      hue={columnHue(column?.color ?? "")}
      title={columnTitle ? `${title} — ${columnTitle}` : title}
      onOpen={() => navigate(routes.card.to(card.id))}
    />
  )
}
