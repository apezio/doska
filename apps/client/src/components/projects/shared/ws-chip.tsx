import { cn } from "@doska/ui-kit"

/** Names the workstream something belongs to. */
export function WsChip({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-block max-w-40 truncate rounded-md border px-1.5 py-px align-middle",
        "text-xs text-muted-foreground",
        className
      )}
    >
      {name}
    </span>
  )
}
