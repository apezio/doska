import { useState } from "react"
import type { Step, Workstream } from "@doska/contract"
import { GripVertical, X } from "lucide-react"
import { Button, Checkbox, cn, Hint, InvisibleInput } from "@doska/ui-kit"
import { useProjectWrite } from "../shared/use-project-write"
import { endDrag, setDrag } from "./drag"
import { hoverProps, itemLit, useLinkHover } from "./link-hover"
import { useProjectCtx } from "./project-context"
import { SessionBadges } from "./session-badges"

/** The workstream's checklist. Every edit writes the whole list against the
 * version it was built from, so a step an agent ticked meanwhile is never
 * silently unticked — the write is refused and the list refetched instead. */
export function StepsList({ ws }: { ws: Workstream }) {
  const { projectId, detail, sessionById } = useProjectCtx()
  const { hover, setHover } = useLinkHover()
  const { mutate: update } = useProjectWrite("workstreamUpdate", projectId)
  const [draft, setDraft] = useState("")

  // Built from the cached list when the write runs, not from this render,
  // so ticking two steps quickly keeps both.
  const write = (edit: (steps: Step[]) => (Step | Omit<Step, "id">)[]) =>
    update((detail) => {
      const cur = detail?.workstreams.find((w) => w.id === ws.id) ?? ws
      return { id: ws.id, ifVersion: cur.version, steps: edit(cur.steps) }
    })

  const patch = (id: string, fields: Partial<Step>) =>
    write((steps) => steps.map((s) => (s.id === id ? { ...s, ...fields } : s)))

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {ws.steps.map((step) => (
          <li
            key={step.id}
            {...hoverProps(setHover, { ws: ws.id, step: step.id })}
            data-link-step={step.id}
            className={cn(
              "group/step -mx-1.5 flex min-h-8 items-center gap-1 rounded-md px-1.5 hover:bg-muted/50",
              itemLit(hover, sessionById, ws.id, step.id) &&
                "bg-primary/5 ring-1 ring-primary/50"
            )}
          >
            <span
              draggable
              onDragStart={(e) =>
                setDrag(e, {
                  kind: "step",
                  workstreamId: ws.id,
                  workstreamName: ws.name,
                  stepId: step.id,
                  text: step.text,
                })
              }
              onDragEnd={endDrag}
              aria-label="Drag step"
              title="Drag onto a session"
              className="flex shrink-0 cursor-grab text-muted-foreground md:opacity-0 md:group-hover/step:opacity-100"
            >
              <GripVertical className="size-3.5" />
            </span>
            <Checkbox
              aria-label={step.done ? "Mark not done" : "Mark done"}
              checked={step.done}
              onCheckedChange={(done) => patch(step.id, { done })}
            />
            <InvisibleInput
              value={step.text}
              label="Step"
              onCommit={(text) => patch(step.id, { text })}
              className={cn(
                "min-w-0 flex-1 py-1 text-sm",
                step.done && "text-muted-foreground line-through"
              )}
            />
            <SessionBadges
              sessions={detail.sessions.filter((s) => s.stepId === step.id)}
              parent={{ ws: ws.id, step: step.id }}
            />
            <Hint label="Remove step">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove step"
                className="size-6 text-muted-foreground md:opacity-0 md:group-hover/step:opacity-100 md:focus-visible:opacity-100"
                onClick={() =>
                  write((steps) => steps.filter((s) => s.id !== step.id))
                }
              >
                <X className="size-3.5" />
              </Button>
            </Hint>
          </li>
        ))}
      </ul>
      <form
        className="-mx-1.5 flex min-h-8 items-center gap-1 pr-1.5 pl-6"
        onSubmit={(e) => {
          e.preventDefault()
          const text = draft.trim()
          if (!text) return
          write((steps) => [...steps, { text, done: false }])
          setDraft("")
        }}
      >
        <Checkbox variant="dashed" disabled aria-hidden tabIndex={-1} />
        <input
          aria-label="New step"
          placeholder="Add a step"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60"
        />
      </form>
    </div>
  )
}
