import { useState } from "react"
import type { ProjectEvent, ProjectEventKind } from "@doska/contract"
import { timeAgo } from "@doska/core/projects"
import { AnimatePresence, motion } from "motion/react"
import {
  CircleDot,
  CircleHelp,
  FileText,
  Link2,
  ListChecks,
  MessageSquare,
  OctagonAlert,
  Route,
  Sparkles,
  SquareTerminal,
  type LucideIcon,
} from "lucide-react"
import { Button, cn, Markdown } from "@doska/ui-kit"
import { Section } from "../shared/section"
import { actorLabel, useProjectCtx } from "./project-context"

const PAGE = 20

const ICON: Record<ProjectEventKind, LucideIcon> = {
  created: Sparkles,
  status: CircleDot,
  summary: FileText,
  plan: Route,
  steps: ListChecks,
  decision: CircleHelp,
  blocker: OctagonAlert,
  card: Link2,
  session: SquareTerminal,
  note: MessageSquare,
}

/** What happened, newest first — and what each change replaced. */
export function ActivitySection() {
  const { detail } = useProjectCtx()
  const [shown, setShown] = useState(PAGE)
  const events = detail.events.slice(0, shown)

  return (
    <Section title="Activity">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing yet.</p>
      ) : (
        <ol className="relative flex flex-col">
          {events.map((e, i) => (
            <EventRow key={e.id} event={e} last={i === events.length - 1} />
          ))}
        </ol>
      )}
      {detail.events.length > shown && (
        <Button
          size="sm"
          variant="ghost"
          className="self-start text-muted-foreground"
          onClick={() => setShown((n) => n + PAGE)}
        >
          Show more
        </Button>
      )}
    </Section>
  )
}

function EventRow({ event: e, last }: { event: ProjectEvent; last: boolean }) {
  const ctx = useProjectCtx()
  const [open, setOpen] = useState(false)
  const Icon = ICON[e.kind]
  const before = replacedContent(e.before)

  return (
    <li className="relative flex gap-3 pb-4">
      {!last && (
        <span
          aria-hidden
          className="absolute top-6 bottom-0 left-[0.6875rem] w-px bg-border"
        />
      )}
      <span
        className={cn(
          "relative flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
          e.kind === "blocker" && "bg-destructive/10 text-destructive",
          e.kind === "decision" &&
            "bg-amber-500/12 text-amber-700 dark:text-amber-300"
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <p className="text-sm leading-snug break-words">{e.message}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>
            {actorLabel(ctx, e)},{" "}
            <time dateTime={new Date(e.createdAt).toISOString()}>
              {timeAgo(e.createdAt)}
            </time>
          </span>
          {before && (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="ml-auto rounded-sm font-medium text-muted-foreground underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {open ? "Hide replaced" : "Show replaced"}
            </button>
          )}
        </p>
        <AnimatePresence initial={false}>
          {open && before && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className="overflow-hidden"
            >
              <Replaced before={before} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  )
}

const FIELD_LABEL: Record<string, string> = {
  plan: "Previous plan",
  summary: "Previous summary",
  steps: "Previous steps",
  status: "Previous status",
  planState: "Previous plan state",
  note: "Previous note",
  name: "Previous name",
  dependsOn: "Previously after",
  description: "Previous description",
}

/** Nothing to show when the replaced values were empty, e.g. a first plan. */
function replacedContent(before: ProjectEvent["before"]) {
  if (!before) return null
  const kept = Object.entries(before).filter(([, v]) =>
    Array.isArray(v) ? v.length > 0 : v !== "" && v != null
  )
  return kept.length ? Object.fromEntries(kept) : null
}

function Replaced({ before }: { before: Record<string, unknown> }) {
  return (
    <div className="mt-2 flex flex-col gap-3 rounded-lg bg-muted/60 p-3">
      {Object.entries(before).map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {FIELD_LABEL[key] ?? key}
          </p>
          <ReplacedValue field={key} value={value} />
        </div>
      ))}
    </div>
  )
}

function ReplacedValue({ field, value }: { field: string; value: unknown }) {
  const { workstreamById } = useProjectCtx()

  if ((field === "plan" || field === "summary") && typeof value === "string")
    return value.trim() ? (
      <Markdown className="text-sm">{value}</Markdown>
    ) : (
      <p className="text-sm text-muted-foreground">Empty</p>
    )

  if (field === "steps" && Array.isArray(value))
    return (
      <ul className="flex flex-col gap-0.5 text-sm">
        {(value as { text?: string; done?: boolean }[]).map((s, i) => (
          <li
            key={i}
            className={cn(s.done && "text-muted-foreground line-through")}
          >
            {s.text}
          </li>
        ))}
      </ul>
    )

  if (field === "dependsOn" && Array.isArray(value))
    return (
      <p className="text-sm">
        {value
          .map(
            (id) =>
              workstreamById.get(String(id))?.name ?? "a removed workstream"
          )
          .join(", ") || "Nothing"}
      </p>
    )

  if (typeof value === "string")
    return <p className="text-sm break-words">{value || "Empty"}</p>

  return (
    <pre className="overflow-x-auto text-xs whitespace-pre-wrap text-muted-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
