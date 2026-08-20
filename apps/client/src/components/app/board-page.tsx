import { useMemo } from "react"
import { DeckView } from "@/components"
import { useActiveDashboard } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { AppShell } from "./app-shell"

interface IProps {
  deckId: string
}

/** One board, at `/d/:id`. */
export function BoardPage({ deckId }: IProps) {
  const { dashboard } = useActiveDashboard(deckId)

  const deck = useMemo(
    () => ({ id: dashboard.id, sort: dashboard.sort ?? [] }),
    [dashboard.id, dashboard.sort]
  )

  return (
    <AppShell deck={deck} cardCloseHref={`~${routes.deck.to(dashboard.id)}`}>
      <DeckView key={dashboard.id} dashboard={dashboard} />
    </AppShell>
  )
}
