import {
  Card as CardBase,
  CardAction,
  CardHeader,
  CardTitle,
  PriorityDot,
  cn,
} from "@doska/ui-kit"
import type { ReactNode } from "react"

interface IProps {
  title: string
  priority: string
  isDragging?: boolean
  /** Top-right slot: the card menu where there is one. */
  action?: ReactNode
  /** The image, already resolved by the caller. */
  children: ReactNode
}

/**
 * A card whose whole content is one image
 */
export function ImageCard({
  title,
  priority,
  isDragging,
  action,
  children,
}: IProps) {
  return (
    <CardBase
      className={cn(
        "gap-0 py-0",
        title && "pt-2",
        isDragging && "shadow-shade/5 shadow-xl"
      )}
    >
      {title ? (
        <CardHeader className="pb-2">
          <CardTitle className="inline-flex items-center gap-1.5">
            {title}
            <PriorityDot value={priority} />
          </CardTitle>
          {action && (
            <CardAction className="flex items-center gap-1">
              {action}
            </CardAction>
          )}
        </CardHeader>
      ) : (
        action && (
          <div className="absolute top-1 right-1 z-10 rounded-md bg-card/70 backdrop-blur-sm">
            {action}
          </div>
        )
      )}
      {children}
    </CardBase>
  )
}
