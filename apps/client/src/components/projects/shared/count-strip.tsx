import type { ProjectSummary } from "@doska/contract"
import { cn } from "@doska/ui-kit"

/** The overview's compact progress: one tick per workstream, done first. */
export function CountStrip({
  counts,
}: {
  counts: ProjectSummary["workstreams"]
}) {
  const { total, done, active, blocked } = counts
  if (total === 0)
    return (
      <div className="h-1.5 rounded-full border border-dashed border-muted-foreground/25" />
    )

  const ticks = [
    ...Array<string>(done).fill("bg-primary"),
    ...Array<string>(active).fill("bg-primary/40"),
    ...Array<string>(blocked).fill("bg-destructive"),
    ...Array<string>(Math.max(0, total - done - active - blocked)).fill(
      "bg-muted-foreground/15"
    ),
  ]
  return (
    <div className="flex h-1.5 gap-0.5" aria-hidden>
      {ticks.map((tone, i) => (
        <span key={i} className={cn("flex-1 rounded-[2px]", tone)} />
      ))}
    </div>
  )
}
