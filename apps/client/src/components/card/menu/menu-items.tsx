import {
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  PriorityChip,
  PRIORITIES,
} from "@doska/ui-kit"
import { generateKeyBetween } from "fractional-indexing"
import { ArrowRightLeft, Check, Flag, Pencil, Trash2 } from "lucide-react"
import { useParams } from "wouter"
import {
  useDeleteCard,
  useMoveCard,
  useUpdateCard,
} from "@doska/core/mutations"
import { useBoard, useCard } from "@doska/core/queries"
import { fallbackCard } from "@doska/core/seed"
import { routes } from "@/lib/routes"
import { byPosition } from "@doska/core/utils"

interface IProps {
  cardId: string
  onEdit: () => void
  align?: "start" | "center" | "end"
}

export function CardMenuItems({ cardId, onEdit, align = "end" }: IProps) {
  const { id: deckId } = useParams<typeof routes.deck.pattern>()
  const { mutate: deleteCard } = useDeleteCard(deckId)

  return (
    <MenuContent align={align} onClick={(e) => e.stopPropagation()}>
      <MenuItem onClick={onEdit}>
        <Pencil />
        Edit
      </MenuItem>
      <MoveToColumnSub cardId={cardId} />
      <PrioritySub cardId={cardId} />
      <MenuSeparator />
      <MenuItem
        onClick={() => deleteCard(cardId)}
        className="ml-auto data-highlighted:text-destructive"
      >
        <Trash2 />
        Delete
      </MenuItem>
    </MenuContent>
  )
}

function PrioritySub({ cardId }: { cardId: string }) {
  const { data: card = fallbackCard } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)

  const isSet = PRIORITIES.some((p) => p.id === card.priority)

  return (
    <MenuSub>
      <MenuSubTrigger>
        <Flag />
        Priority
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        <MenuItem onClick={() => updateCard({ priority: "" })}>
          <Flag className="size-3.5 text-muted-foreground" />
          No priority
          {!isSet && <Check className="ml-auto" />}
        </MenuItem>
        {PRIORITIES.map((option) => (
          <MenuItem
            key={option.id}
            onClick={() => updateCard({ priority: option.id })}
          >
            <PriorityChip value={option.id} />
            {option.label}
            {option.id === card.priority && <Check className="ml-auto" />}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuSub>
  )
}

function MoveToColumnSub({ cardId }: { cardId: string }) {
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
