import { createElement, type ReactNode } from "react"
import { cn } from "../lib/cn"

export function MdHeading({
  depth,
  children,
}: {
  depth: number
  children: ReactNode
}) {
  return createElement(
    `h${Math.min(depth, 6)}`,
    {
      className: cn(
        "mt-4 mb-2 font-heading text-base leading-tight font-bold tracking-[-0.01em]",
        depth >= 3 && "text-muted-foreground"
      ),
    },
    children
  )
}
