import { Triangle } from "lucide-react"
import { PRIORITIES } from "@doska/tokens/priority"
import { cn } from "./lib/cn"

const CHIP_BY_PRIORITY: Record<string, string> = {
  high: "text-destructive",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-muted-foreground",
}

interface IProps {
  value: string
  className?: string
}

/** The priority badge: one filled triangle, colored by how urgent the level is. */
export function PriorityChip({ value, className }: IProps) {
  const priority = PRIORITIES.find((p) => p.id === value)
  if (!priority) return null

  return (
    <span
      className={cn(
        "inline-flex items-center",
        CHIP_BY_PRIORITY[priority.id],
        className
      )}
      aria-label={`Priority: ${priority.label}`}
    >
      <Triangle className="size-3.5 fill-current stroke-1" />
    </span>
  )
}
