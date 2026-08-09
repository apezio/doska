import { useIsMobile } from "@doska/ui-kit"
import { useCallback, useEffect, useState } from "react"
import { useLocation, useRoute } from "wouter"
import { routes } from "@/lib/routes"
import { CardPane } from "./card-pane"
import { CardPanelShell } from "./card-panel-shell"
import { useCardSave } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"

interface IProps {
  /** Where to navigate when the panel closes (its deck root). */
  closeHref: string
}

export function CardPanel({ closeHref }: IProps) {
  const [, navigate] = useLocation()
  const [, routeParams] = useRoute(routes.card.pattern)
  const routeId = routeParams?.id ?? null

  // Outlives the route change, so the card stays on screen while the panel sweeps shut.
  const [lastCard, setLastCard] = useState(routeId)
  if (routeId && routeId !== lastCard) setLastCard(routeId)

  const { queue, flush } = useCardSave()

  const isMobile = useIsMobile()
  const card = routeId ?? (isMobile ? null : lastCard)
  const isOpen = routeId != null
  const { data: content } = useCard(card)

  const close = useCallback(() => {
    flush()
    navigate(closeHref)
  }, [flush, navigate, closeHref])

  useEffect(() => {
    if (isOpen && content?.deletedAt) close()
  }, [isOpen, content?.deletedAt, close])

  return (
    <CardPanelShell
      isOpen={isOpen}
      onClose={close}
      onClosed={() => setLastCard(null)}
    >
      {card && content && (
        <CardPane
          key={card}
          cardId={card}
          content={content}
          onQueue={queue}
          onClose={close}
        />
      )}
    </CardPanelShell>
  )
}
