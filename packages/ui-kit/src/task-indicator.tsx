import { cn } from "./lib/cn"
import { Circle, CircleCheck } from "lucide-react"

interface IProps {
  done: number
  total: number
}

export function TaskIndicator({ done, total }: IProps) {
  const complete = done === total
  const Icon = complete ? CircleCheck : Circle
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono",
        "text-sm text-muted-foreground tabular-nums md:text-xs"
        // complete
        //   ? "bg-success text-success-foreground"
        //   : "text-muted-foreground"
      )}
    >
      <Icon className="size-4 md:size-3.5" />
      <span className="mt-px">
        {done}/{total}
      </span>
    </span>
  )
}
