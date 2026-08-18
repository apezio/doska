import { Draggable } from "@hello-pangea/dnd"
import { memo } from "react"
import { useLocation } from "wouter"
import type { CardPatch } from "@doska/core/mutations"
import type { Card as CardData, Column } from "@doska/core/types"
import { DROP_ANIMATION_MS } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { Card } from "./card"
import { OrderAnimator } from "./order-animator"

interface IProps {
  card: CardData
  column: Column
  index: number
  showBody: boolean
  onPatch: (id: string, patch: CardPatch) => void
  /** The card has finished its drop animation and is back in the layout. */
  onDropSettled: (id: string) => void
}

export const DraggableCard = memo(function DraggableCard({
  card,
  column,
  index,
  showBody,
  onPatch,
  onDropSettled,
}: IProps) {
  const [, navigate] = useLocation()
  const id = card.id

  return (
    <OrderAnimator>
      <Draggable draggableId={id} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              ...(snapshot.isDropAnimating && {
                transitionDuration: `${DROP_ANIMATION_MS}ms`,
              }),
            }}
            onTransitionEnd={(event) => {
              provided.draggableProps.onTransitionEnd?.(event)
              if (
                event.target === event.currentTarget &&
                event.propertyName === "transform"
              )
                onDropSettled(id)
            }}
            onClick={(e) => {
              if (snapshot.isDragging) return
              e.currentTarget.blur()
              navigate(routes.card.to(id))
            }}
            isDragging={snapshot.isDragging}
            showBody={showBody}
            card={card}
            column={column}
            onPatch={onPatch}
          />
        )}
      </Draggable>
    </OrderAnimator>
  )
})
