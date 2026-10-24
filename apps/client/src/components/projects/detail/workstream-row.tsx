import { useState, type ReactNode } from "react"
import type { Workstream } from "@doska/contract"
import { pendingDependencies } from "@doska/core/projects"
import { AnimatePresence, motion } from "motion/react"
import {
  ChevronRight,
  CircleCheck,
  Hourglass,
  ListChecks,
  Trash2,
} from "lucide-react"
import { Button, cn, Hint, InvisibleInput } from "@doska/ui-kit"
import { ConfirmDialog } from "../../confirm-dialog"
import { MarkdownField } from "../shared/markdown-field"
import { WORKSTREAM_STATUS } from "../shared/status"
import { StatusMenu } from "../shared/status-menu"
import { useProjectWrite } from "../shared/use-project-write"
import { DependencyPicker } from "./dependency-picker"
import { LinkedCardRow } from "./linked-card-row"
import { useProjectCtx } from "./project-context"
import { SessionCard } from "./session-card"
import { StepsList } from "./steps-list"

const EXPAND = { duration: 0.22, ease: [0.2, 0, 0, 1] } as const

export function WorkstreamRow({ ws }: { ws: Workstream }) {
  const { projectId, workstreams, workstreamById, openIds, setOpen } =
    useProjectCtx()
  const { mutate: update } = useProjectWrite("workstreamUpdate", projectId)
  const open = openIds.has(ws.id)
  const panelId = `ws-panel-${ws.id}`

  const done = ws.steps.filter((s) => s.done).length
  const finished = ws.status === "done" || ws.status === "deferred"
  const waitingOn = finished ? [] : pendingDependencies(ws, workstreams)
  const after = ws.dependsOn
    .map((id) => workstreamById.get(id)?.name)
    .filter(Boolean)

  return (
    <li
      id={`ws-${ws.id}`}
      className={cn(
        "scroll-mt-4 rounded-xl bg-card shadow-e1 ring-1 ring-foreground/10 transition-shadow",
        open && "shadow-e2"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-1.5">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? `Collapse ${ws.name}` : undefined}
            onClick={() => setOpen(ws.id, !open)}
            className={cn(
              "-my-1 -ml-1 flex items-center gap-1.5 rounded-md py-1 pl-1 text-left outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              !open && "min-w-0 flex-1"
            )}
          >
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-90"
              )}
            />
            {ws.status === "done" && (
              <CircleCheck className="size-4 shrink-0 text-primary" />
            )}
            {!open && (
              <span
                className={cn(
                  "truncate text-sm font-semibold",
                  finished && "text-muted-foreground"
                )}
              >
                {ws.name}
              </span>
            )}
          </button>
          {/* Open, the name is editable in place rather than repeated below. */}
          {open && (
            <InvisibleInput
              value={ws.name}
              label="Workstream name"
              onCommit={(name) => update({ id: ws.id, name })}
              className="-ml-1 block min-w-0 flex-1 px-1 py-0.5 text-sm font-semibold"
            />
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {waitingOn.length > 0 ? (
            <Meta
              className="text-amber-700 dark:text-amber-300"
              icon={<Hourglass className="size-3.5" />}
            >
              Waiting on {waitingOn[0].name}
              {waitingOn.length > 1 && ` +${waitingOn.length - 1}`}
            </Meta>
          ) : (
            after.length > 0 && (
              <Meta className="max-md:hidden">After {after.join(", ")}</Meta>
            )
          )}
          {ws.steps.length > 0 && (
            <Meta icon={<ListChecks className="size-3.5" />}>
              <span className="tabular-nums">
                {done}/{ws.steps.length}
              </span>
            </Meta>
          )}
          <PlanChip
            state={ws.planState}
            hasPlan={ws.plan.trim() !== ""}
            // Approving is a claim about the plan on screen, so it must not
            // land on one a session replaced a moment ago.
            onToggle={() =>
              update({
                id: ws.id,
                ifVersion: ws.version,
                planState:
                  ws.planState === "proposed" ? "approved" : "proposed",
              })
            }
          />
          <StatusMenu
            label="Workstream status"
            value={ws.status}
            options={WORKSTREAM_STATUS}
            onChange={(status) => update({ id: ws.id, status })}
          />
        </div>

        {ws.note && !open && (
          <p className="w-full truncate pl-6.5 text-sm text-muted-foreground">
            {ws.note}
          </p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={EXPAND}
            className="overflow-hidden"
          >
            <WorkstreamPanel ws={ws} />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

function Meta({
  icon,
  className,
  children,
}: {
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-52 items-center gap-1 px-1 text-xs text-muted-foreground",
        className
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  )
}

/** A proposed plan is drawn tentatively — dashed and quiet — until approved. */
function PlanChip({
  state,
  hasPlan,
  onToggle,
}: {
  state: Workstream["planState"]
  hasPlan: boolean
  onToggle: () => void
}) {
  if (!hasPlan && state === "proposed") return null
  const proposed = state === "proposed"
  return (
    <Hint label={proposed ? "Approve this plan" : "Send back to proposed"}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold",
          "transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          proposed
            ? "border border-dashed border-muted-foreground/45 text-muted-foreground hover:border-primary/60 hover:text-primary"
            : "bg-primary/10 text-primary hover:bg-primary/15"
        )}
      >
        {proposed ? "Proposed" : "Approved"}
      </button>
    </Hint>
  )
}

function WorkstreamPanel({ ws }: { ws: Workstream }) {
  const { projectId, detail } = useProjectCtx()
  const { mutate: update, mutateAsync: updateAsync } = useProjectWrite(
    "workstreamUpdate",
    projectId
  )
  const { mutate: remove } = useProjectWrite("workstreamRemove", projectId)
  const [confirming, setConfirming] = useState(false)
  const cards = detail.cards.filter((c) => c.workstreamId === ws.id)
  const sessions = detail.sessions.filter((s) => s.workstreamId === ws.id)

  return (
    <div className="flex flex-col gap-6 border-t px-4 pt-4 pb-4 md:pl-9">
      <InvisibleInput
        value={ws.note}
        label="Note"
        allowEmpty
        placeholder="Add a note: what it's waiting on or blocked by"
        onCommit={(note) => update({ id: ws.id, note })}
        className="-mx-2 block text-sm text-muted-foreground"
      />

      <Block
        title={
          !ws.plan.trim()
            ? "Plan"
            : ws.planState === "proposed"
              ? "Plan (proposed)"
              : "Plan (approved)"
        }
      >
        <MarkdownField
          label="Plan"
          askWhy
          value={ws.plan}
          version={ws.version}
          empty="No plan yet. Write one, or let a session propose it. A plan stays proposed until you approve it."
          markdownClassName="text-sm"
          className={cn(
            ws.plan.trim() &&
              ws.planState === "proposed" &&
              "rounded-lg border border-dashed border-muted-foreground/30 p-3"
          )}
          onSave={(plan, why, ifVersion) =>
            updateAsync({
              id: ws.id,
              ifVersion,
              plan,
              message: why || undefined,
            })
          }
        />
      </Block>

      <Block title="Steps">
        <StepsList ws={ws} />
      </Block>

      <Block title="Comes after">
        <DependencyPicker ws={ws} />
      </Block>

      {cards.length > 0 && (
        <Block title="Cards">
          <ul className="flex flex-col">
            {cards.map((c) => (
              <LinkedCardRow key={c.cardId} card={c} />
            ))}
          </ul>
        </Block>
      )}

      {sessions.length > 0 && (
        <Block title="Sessions">
          <ul className="grid gap-2 sm:grid-cols-2">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} showWorkstream={false} />
            ))}
          </ul>
        </Block>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setConfirming(true)}
        >
          <Trash2 />
          Remove workstream
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Remove workstream?"
        description={`"${ws.name}" and its plan and steps go away. Its cards and sessions stay on the project.`}
        confirmLabel="Remove workstream"
        onConfirm={() => remove({ id: ws.id })}
      />
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}
