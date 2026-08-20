import { MenuContent, MenuItem, MenuSub, MenuSubTrigger } from "@doska/ui-kit"
import { generateKeyBetween } from "fractional-indexing"
import { ArrowRightLeft } from "lucide-react"
import { useParams } from "wouter"
import { useMoveCard } from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { byPosition } from "@doska/core/utils"
import { routes } from "@/lib/routes"

/** Moves the card to the end of another column. */
export function MoveToColumnSub({ cardId }: { cardId: string }) {
  const { id: deckId } = useParams<typeof routes.deck.pattern>()
  const { data: board } = useBoard(deckId)
  const { mutate: moveCard } = useMoveCard(deckId)

  const columns = [...(board?.columns ?? [])].sort(byPosition)
  const moved = board?.cards.find((c) => c.id === cardId)

  function moveTo(columnId: string) {
    if (!board || !moved || moved.columnId === columnId) return

    const destCards = board.cards
      .filter((c) => c.columnId === columnId && c.id !== cardId)
      .sort(byPosition)
    const last = destCards[destCards.length - 1]
    const position = generateKeyBetween(last?.position ?? null, null)

    moveCard([{ ...moved, columnId, position }])
  }

  return (
    <MenuSub>
      <MenuSubTrigger>
        <ArrowRightLeft />
        Move to
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        {columns.map((column) => (
          <MenuItem
            key={column.id}
            disabled={column.id === moved?.columnId}
            onClick={() => moveTo(column.id)}
            className="data-disabled:pointer-events-none data-disabled:opacity-50"
          >
            {column.title}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuSub>
  )
}
