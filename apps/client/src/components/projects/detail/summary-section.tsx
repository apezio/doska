import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { timeAgo } from "@doska/core/projects"
import { cn, Markdown } from "@doska/ui-kit"
import { MarkdownField } from "../shared/markdown-field"
import { useProjectWrite } from "../shared/use-project-write"
import { actorLabel, useProjectCtx } from "./project-context"
import { countItems, isEmptyBlock, splitSummary } from "./summary-blocks"
import { WorkstreamStrip } from "./workstream-strip"

const LEAD = "text-[1.0625rem] leading-[1.65]"
const BODY = "text-[0.9375rem] leading-relaxed"

/** "Where things stand" — the first thing read, so it leads the page. */
export function SummarySection() {
  const ctx = useProjectCtx()
  const { project, events } = ctx.detail
  const { mutateAsync: update } = useProjectWrite("update", ctx.projectId)

  const lastEdit = events.find((e) => e.before && "summary" in e.before)
  const at = project.summaryUpdatedAt ?? lastEdit?.createdAt

  return (
    <section aria-labelledby="summary-heading" className="flex flex-col gap-5">
      <div className="flex max-w-[68ch] flex-col gap-2">
        <h2
          id="summary-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          Where things stand
        </h2>
        <MarkdownField
          label="Summary"
          value={project.summary}
          version={project.version}
          empty="Write a few lines on where this stands, what's next and what's in the way."
          view={(md) => <SummaryView md={md} />}
          onSave={(summary, _why, ifVersion) =>
            update({ id: ctx.projectId, ifVersion, summary })
          }
        />
        {at && project.summary.trim() && (
          <p className="text-xs text-muted-foreground">
            Updated {timeAgo(at)}
            {lastEdit && ` by ${actorLabel(ctx, lastEdit, true)}`}
          </p>
        )}
      </div>
      <WorkstreamStrip />
    </section>
  )
}

/** What is left leads; what is parked or done stays folded until asked for. */
function SummaryView({ md }: { md: string }) {
  const s = splitSummary(md)
  if (!s) return <Markdown className={LEAD}>{md}</Markdown>
  const waiting = isEmptyBlock(s.waiting) ? "" : s.waiting

  return (
    <div className="flex flex-col gap-4">
      {s.lead && <Markdown className={LEAD}>{s.lead}</Markdown>}
      {s.next && <Block label="Next step">{s.next}</Block>}
      {waiting && (
        <Block label="Waiting on you" warn>
          {waiting}
        </Block>
      )}
      {s.open && <Block label="Still open">{s.open}</Block>}
      {s.deferred && <Folded label="Deferred">{s.deferred}</Folded>}
      {s.done && <Folded label="Done so far">{s.done}</Folded>}
    </div>
  )
}

/** Closed until clicked: parked or finished work, out of the way. */
function Folded({ label, children }: { label: string; children: string }) {
  const count = countItems(children)
  return (
    <details className="group/fold">
      <summary
        className={cn(
          "flex w-fit cursor-pointer list-none items-center gap-1",
          "text-sm font-semibold text-muted-foreground hover:text-foreground",
          "[&::-webkit-details-marker]:hidden"
        )}
      >
        <ChevronRight className="size-4 transition-transform duration-200 group-open/fold:rotate-90" />
        {label}
        {count > 0 && (
          <span className="font-normal tabular-nums">· {count}</span>
        )}
      </summary>
      <Markdown className={cn(BODY, "mt-1.5 pl-5 text-muted-foreground")}>
        {children}
      </Markdown>
    </details>
  )
}

function Block({
  label,
  warn,
  children,
}: {
  label: string
  warn?: boolean
  children: string
}): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <h3
        className={cn(
          "text-sm font-semibold",
          warn
            ? "text-amber-700 dark:text-amber-300"
            : "text-muted-foreground"
        )}
      >
        {label}
      </h3>
      <Markdown className={BODY}>{children}</Markdown>
    </div>
  )
}
