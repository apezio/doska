import type { Workstream } from "@doska/contract"
import { cn, Hint } from "@doska/ui-kit"
import { WORKSTREAM_STATUS } from "../shared/status"
import { revealWorkstream, useProjectCtx } from "./project-context"

const TRACK: Record<Workstream["status"], string> = {
  done: "bg-primary",
  active: "bg-primary/18",
  blocked: "bg-destructive/20",
  waiting: "bg-amber-500/22",
  planned: "bg-muted-foreground/12",
  deferred:
    "bg-transparent outline-1 -outline-offset-1 outline-dashed outline-muted-foreground/30",
}

const FILL: Partial<Record<Workstream["status"], string>> = {
  active: "bg-primary",
  blocked: "bg-destructive",
  waiting: "bg-amber-500 dark:bg-amber-400",
}

/** A sliver of fill even with no steps ticked, so started reads as started. */
const MIN_FILL = 0.12

function fillOf(ws: Workstream): number {
  if (!FILL[ws.status]) return 0
  const total = ws.steps.length
  const done = ws.steps.filter((s) => s.done).length
  return Math.max(MIN_FILL, total ? done / total : 0)
}

/**
 * The project at a glance: one segment per workstream, in order, filled by
 * its steps and coloured by its status. Each segment opens its workstream.
 */
export function WorkstreamStrip() {
  const ctx = useProjectCtx()
  const { workstreams } = ctx
  if (workstreams.length === 0) return null

  const done = workstreams.filter((w) => w.status === "done").length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {workstreams.map((ws) => {
          const status = WORKSTREAM_STATUS[ws.status]
          const steps = ws.steps.length
            ? `, ${ws.steps.filter((s) => s.done).length} of ${ws.steps.length} steps`
            : ""
          const label = `${ws.name}: ${status.label}${steps}`
          return (
            <Hint key={ws.id} label={label}>
              <button
                type="button"
                aria-label={label}
                onClick={() => revealWorkstream(ctx, ws.id)}
                className={cn(
                  "group relative h-2.5 min-w-3 flex-1 overflow-hidden rounded-[3px]",
                  "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  TRACK[ws.status]
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 transition-[width] duration-500",
                    FILL[ws.status]
                  )}
                  style={{ width: `${fillOf(ws) * 100}%` }}
                />
                <span className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
              </button>
            </Hint>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {done} of {workstreams.length}{" "}
        {workstreams.length === 1 ? "workstream" : "workstreams"} done
      </p>
    </div>
  )
}
