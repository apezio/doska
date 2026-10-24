import { useState } from "react"
import type { DecisionKind, ProjectDecision } from "@doska/contract"
import { attentionOf, timeAgo } from "@doska/core/projects"
import { CircleHelp, OctagonAlert, Plus } from "lucide-react"
import { Button, cn, Input } from "@doska/ui-kit"
import { NativeSelect } from "../shared/native-select"
import { plainText } from "../shared/plain-text"
import { Section } from "../shared/section"
import { StatusPill } from "../shared/status-pill"
import { WORKSTREAM_STATUS } from "../shared/status"
import { useProjectWrite } from "../shared/use-project-write"
import { WsChip } from "../shared/ws-chip"
import { useProjectCtx } from "./project-context"
import { ResolveModal } from "./resolve-modal"

/** Open decisions, open blockers and stalled workstreams: what waits on you. */
export function AttentionSection() {
  const { detail, workstreams } = useProjectCtx()
  const [adding, setAdding] = useState(false)
  const [resolving, setResolving] = useState<ProjectDecision | null>(null)

  const { decisions, blockers, stalled } = attentionOf(
    detail.decisions,
    workstreams
  )
  const count = decisions.length + blockers.length + stalled.length

  const add = (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground"
      onClick={() => setAdding(true)}
    >
      <Plus />
      Raise
    </Button>
  )

  if (count === 0 && !adding)
    return (
      <div className="flex min-h-9 items-center gap-2 rounded-xl border border-dashed px-3 py-1 text-sm text-muted-foreground">
        <span className="flex-1">Nothing needs you right now.</span>
        {add}
      </div>
    )

  return (
    <Section
      title="Needs your attention"
      meta={count || undefined}
      actions={!adding && add}
    >
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-xl bg-card shadow-e1 ring-1 ring-foreground/10",
          "divide-y"
        )}
      >
        {[...blockers, ...decisions].map((d) => (
          <DecisionRow key={d.id} item={d} onResolve={() => setResolving(d)} />
        ))}
        {stalled.map((ws) => (
          <StalledRow key={ws.id} id={ws.id} />
        ))}
        {adding && <RaiseForm onDone={() => setAdding(false)} />}
      </div>
      <ResolveModal item={resolving} onClose={() => setResolving(null)} />
    </Section>
  )
}

const KIND = {
  decision: { Icon: CircleHelp, tone: "text-amber-600 dark:text-amber-400" },
  blocker: { Icon: OctagonAlert, tone: "text-destructive" },
}

function DecisionRow({
  item,
  onResolve,
}: {
  item: ProjectDecision
  onResolve: () => void
}) {
  const { workstreamById } = useProjectCtx()
  const { Icon, tone } = KIND[item.kind]
  const ws = item.workstreamId ? workstreamById.get(item.workstreamId) : null
  const body = plainText(item.body)

  return (
    <div className="flex gap-3 px-3.5 py-3">
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm leading-snug font-semibold">
          <span className="sr-only">
            {item.kind === "decision" ? "Decision: " : "Blocker: "}
          </span>
          {item.title}
        </p>
        {body && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{body}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {ws && <WsChip name={ws.name} />}
          <span className="text-xs text-muted-foreground">
            {timeAgo(item.createdAt)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto h-6.5"
            onClick={onResolve}
          >
            {item.kind === "decision" ? "Decide…" : "Resolve…"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function StalledRow({ id }: { id: string }) {
  const { workstreamById, setOpen } = useProjectCtx()
  const ws = workstreamById.get(id)
  if (!ws) return null
  const status = WORKSTREAM_STATUS[ws.status]

  return (
    <button
      type="button"
      onClick={() => {
        setOpen(id, true)
        document
          .getElementById(`ws-${id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }}
      className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted"
    >
      <StatusPill tone={status.tone} label={status.label} className="mt-px" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold">{ws.name}</span>
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {ws.note || "No note on what it's waiting for."}
        </span>
      </span>
    </button>
  )
}

function RaiseForm({ onDone }: { onDone: () => void }) {
  const { projectId, workstreams } = useProjectCtx()
  const [kind, setKind] = useState<DecisionKind>("decision")
  const [title, setTitle] = useState("")
  const [workstreamId, setWorkstreamId] = useState("")
  const { mutate: create, isPending } = useProjectWrite(
    "decisionCreate",
    projectId
  )

  return (
    <form
      className="flex flex-col gap-2 bg-muted/40 px-3.5 py-3"
      onKeyDown={(e) => e.key === "Escape" && onDone()}
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        create(
          {
            projectId,
            kind,
            title: title.trim(),
            workstreamId: workstreamId || undefined,
          },
          { onSuccess: onDone }
        )
      }}
    >
      <div
        role="radiogroup"
        aria-label="Kind"
        className="flex w-fit gap-0.5 rounded-lg bg-muted p-0.5"
      >
        {(["decision", "blocker"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              "h-6 rounded-md px-2.5 text-xs font-semibold transition-colors outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              kind === k
                ? "bg-card text-foreground shadow-e1"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {k === "decision" ? "Decision" : "Blocker"}
          </button>
        ))}
      </div>
      <Input
        autoFocus
        aria-label="Title"
        placeholder={
          kind === "decision" ? "What needs deciding?" : "What's in the way?"
        }
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {workstreams.length > 0 && (
          <NativeSelect
            aria-label="Workstream"
            value={workstreamId}
            onChange={(e) => setWorkstreamId(e.target.value)}
            className="max-w-52 flex-1"
          >
            <option value="">Whole project</option>
            {workstreams.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </NativeSelect>
        )}
        <div className="ml-auto flex gap-1.5">
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!title.trim() || isPending}>
            Add {kind}
          </Button>
        </div>
      </div>
    </form>
  )
}
