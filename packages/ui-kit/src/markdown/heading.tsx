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
        "mt-4 mb-2 font-heading leading-tight tracking-heading",
        depth === 1 && "text-xl font-bold",
        depth === 2 && "text-lg font-bold",
        depth >= 3 && "text-base font-semibold",
        depth >= 3 && "text-muted-foreground"
      ),
    },
    children
  )
}
