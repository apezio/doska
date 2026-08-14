import { Draggable } from "@hello-pangea/dnd"
import { motion } from "motion/react"
import { useLocation } from "wouter"
import { DROP_ANIMATION_MS } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { Card } from "./card"

interface IProps {
  id: string
  index: number
  showBody: boolean
  animateOrder: boolean
  /** The card has finished its drop animation and is back in the layout. */
  onDropSettled?: () => void
}

export function DraggableCard({
  id,
  index,
  showBody,
  animateOrder,
  onDropSettled,
}: IProps) {
  const [, navigate] = useLocation()

  return (
    <motion.div
      layout={animateOrder ? "position" : false}
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
    >
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
                onDropSettled?.()
            }}
            onClick={(e) => {
              if (snapshot.isDragging) return
              e.currentTarget.blur()
              navigate(routes.card.to(id))
            }}
            isDragging={snapshot.isDragging}
            showBody={showBody}
            id={id}
          />
        )}
      </Draggable>
    </motion.div>
  )
}
