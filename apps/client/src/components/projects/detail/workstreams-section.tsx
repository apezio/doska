import { useState } from "react"
import { ChevronRight, Plus } from "lucide-react"
import { Button, cn, Input } from "@doska/ui-kit"
import { Section } from "../shared/section"
import { useProjectWrite } from "../shared/use-project-write"
import { useProjectCtx } from "./project-context"
import { WorkstreamRow } from "./workstream-row"

export function WorkstreamsSection() {
  const { workstreams, openIds, setOpen } = useProjectCtx()
  const [adding, setAdding] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const shown = workstreams.filter((ws) => !ws.hidden)
  const hidden = workstreams.filter((ws) => ws.hidden)
  // An expanded hidden row keeps the group open, so reveal paths can land on it.
  const hiddenOpen = showHidden || hidden.some((ws) => openIds.has(ws.id))

  const toggleHidden = () => {
    if (hiddenOpen) hidden.forEach((ws) => setOpen(ws.id, false))
    setShowHidden(!hiddenOpen)
  }

  return (
    <Section
      title="Workstreams"
      meta={workstreams.length || undefined}
      actions={
        !adding && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setAdding(true)}
          >
            <Plus />
            Add workstream
          </Button>
        )
      }
    >
      {workstreams.length === 0 && !adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-xl border border-dashed px-4 py-6 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
        >
          Split the project into workstreams: parallel tracks of work, each with
          its own plan and steps, that one person or session can own.
        </button>
      ) : (
        <>
          {shown.length > 0 && (
            <ul className="flex flex-col gap-2">
              {shown.map((ws) => (
                <WorkstreamRow key={ws.id} ws={ws} />
              ))}
            </ul>
          )}
          {hidden.length > 0 && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="self-start text-muted-foreground"
                aria-expanded={hiddenOpen}
                onClick={toggleHidden}
              >
                <ChevronRight
                  className={cn(
                    "transition-transform duration-200",
                    hiddenOpen && "rotate-90"
                  )}
                />
                {hiddenOpen ? "Hide hidden" : `Show ${hidden.length} hidden`}
              </Button>
              {hiddenOpen && (
                <ul className="flex flex-col gap-2">
                  {hidden.map((ws) => (
                    <WorkstreamRow key={ws.id} ws={ws} />
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
      {adding && <AddWorkstream onDone={() => setAdding(false)} />}
    </Section>
  )
}

function AddWorkstream({ onDone }: { onDone: () => void }) {
  const { projectId, setOpen } = useProjectCtx()
  const [name, setName] = useState("")
  const { mutate: create, isPending } = useProjectWrite(
    "workstreamCreate",
    projectId
  )

  return (
    <form
      className="flex gap-1.5"
      onKeyDown={(e) => e.key === "Escape" && onDone()}
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        create(
          { projectId, name: name.trim() },
          {
            onSuccess: (ws) => {
              setOpen(ws.id, true)
              onDone()
            },
          }
        )
      }}
    >
      <Input
        autoFocus
        aria-label="Workstream name"
        placeholder="Workstream name, e.g. Migrate the zone files"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" disabled={!name.trim() || isPending}>
        Add
      </Button>
      <Button type="button" variant="ghost" onClick={onDone}>
        Cancel
      </Button>
    </form>
  )
}
