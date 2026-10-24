import type { Workstream } from "@doska/contract"
import { Check } from "lucide-react"
import { cn } from "@doska/ui-kit"
import { useProjectWrite } from "../shared/use-project-write"
import { useProjectCtx } from "./project-context"

/** Which sibling workstreams have to finish before this one. */
export function DependencyPicker({ ws }: { ws: Workstream }) {
  const { projectId, workstreams } = useProjectCtx()
  const { mutate: update } = useProjectWrite("workstreamUpdate", projectId)
  const siblings = workstreams.filter((w) => w.id !== ws.id)

  if (siblings.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Add another workstream to say what this one waits for.
      </p>
    )

  const toggle = (id: string) =>
    update((detail) => {
      const cur = detail?.workstreams.find((w) => w.id === ws.id) ?? ws
      return {
        id: ws.id,
        ifVersion: cur.version,
        dependsOn: cur.dependsOn.includes(id)
          ? cur.dependsOn.filter((d) => d !== id)
          : [...cur.dependsOn, id],
      }
    })

  return (
    <div className="flex flex-wrap gap-1.5">
      {siblings.map((w) => {
        const on = ws.dependsOn.includes(w.id)
        // Two workstreams each waiting on the other would never start.
        const cycle = !on && w.dependsOn.includes(ws.id)
        return (
          <button
            key={w.id}
            type="button"
            aria-pressed={on}
            disabled={cycle}
            title={cycle ? `${w.name} already waits on this one` : undefined}
            onClick={() => toggle(w.id)}
            className={cn(
              "inline-flex h-7 max-w-56 items-center gap-1 rounded-full border px-2.5",
              "text-xs font-medium transition-colors outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40",
              on
                ? "border-primary/40 bg-primary/10 text-primary"
                : "text-muted-foreground hover:border-foreground/25 hover:text-foreground"
            )}
          >
            {on && <Check className="size-3" strokeWidth={3} />}
            <span className="truncate">{w.name}</span>
          </button>
        )
      })}
    </div>
  )
}
