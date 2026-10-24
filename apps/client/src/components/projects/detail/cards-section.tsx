import { useState } from "react"
import type { LinkedCard } from "@doska/contract"
import { Plus } from "lucide-react"
import { Button } from "@doska/ui-kit"
import { Section } from "../shared/section"
import { CardPickerModal } from "./card-picker-modal"
import { LinkedCardRow } from "./linked-card-row"
import { useProjectCtx } from "./project-context"

function byBoard(cards: LinkedCard[]) {
  const groups = new Map<string, { name: string; cards: LinkedCard[] }>()
  for (const c of cards) {
    const g = groups.get(c.boardId) ?? { name: c.boardName, cards: [] }
    g.cards.push(c)
    groups.set(c.boardId, g)
  }
  return [...groups.entries()]
}

/** Cards stay the source of truth for task state; the project only points. */
export function CardsSection() {
  const { detail } = useProjectCtx()
  const [picking, setPicking] = useState(false)
  const done = detail.cards.filter((c) => c.done).length

  return (
    <Section
      title="Linked cards"
      meta={
        detail.cards.length ? `${done}/${detail.cards.length} done` : undefined
      }
      actions={
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => setPicking(true)}
        >
          <Plus />
          Link card
        </Button>
      }
    >
      {detail.cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Link the board cards this project tracks; their done state shows up
          here.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {byBoard(detail.cards).map(([boardId, g]) => (
            <div key={boardId} className="flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-muted-foreground">
                {g.name || "A board you can't see"}
              </h3>
              <ul className="flex flex-col">
                {g.cards.map((c) => (
                  <LinkedCardRow key={c.cardId} card={c} showWorkstream />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <CardPickerModal open={picking} onOpenChange={setPicking} />
    </Section>
  )
}
