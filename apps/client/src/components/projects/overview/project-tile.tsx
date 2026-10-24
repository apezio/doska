import type { ProjectSummary } from "@doska/contract"
import { timeAgo } from "@doska/core/projects"
import { cn } from "@doska/ui-kit"
import { Link } from "wouter"
import { routes } from "@/lib/routes"
import { CountStrip } from "../shared/count-strip"
import { plainText } from "../shared/plain-text"
import { PROJECT_STATUS } from "../shared/status"
import { StatusPill } from "../shared/status-pill"
import { LiveDot } from "../shared/live-dot"

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`

export function ProjectTile({ project: p }: { project: ProjectSummary }) {
  const status = PROJECT_STATUS[p.status]
  const summary = plainText(p.summary) || p.description
  const resting = p.status === "paused" || p.status === "done"

  return (
    <Link
      href={`~${routes.project.to(p.id)}`}
      className={cn(
        "group flex min-w-0 flex-col gap-3 rounded-xl bg-card p-4 text-card-foreground",
        "shadow-e1 ring-1 ring-foreground/10 transition-shadow outline-none",
        "hover:shadow-e2 hover:ring-foreground/15",
        "focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
    >
      <div className="flex items-start gap-3">
        <h3
          className={cn(
            "min-w-0 flex-1 truncate text-base leading-snug font-semibold tracking-heading",
            resting && "text-muted-foreground"
          )}
        >
          {p.name}
        </h3>
        <StatusPill tone={status.tone} label={status.label} />
      </div>

      <p
        className={cn(
          "line-clamp-2 min-h-[2lh] text-sm leading-relaxed",
          summary ? "text-muted-foreground" : "text-muted-foreground/60"
        )}
      >
        {summary || "No summary yet."}
      </p>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <CountStrip counts={p.workstreams} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {p.workstreams.total === 0
            ? "No workstreams"
            : `${p.workstreams.done}/${p.workstreams.total}`}
        </span>
      </div>

      <div className="flex min-h-5.5 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {p.openDecisions > 0 && (
          <span className="rounded-full bg-amber-500/12 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
            {plural(p.openDecisions, "decision")}
          </span>
        )}
        {p.openBlockers > 0 && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
            {plural(p.openBlockers, "blocker")}
          </span>
        )}
        {p.activeSessions > 0 && (
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <LiveDot />
            {plural(p.activeSessions, "session")} active
          </span>
        )}
        <span className="ml-auto text-muted-foreground tabular-nums">
          {timeAgo(p.lastActivityAt)}
        </span>
      </div>
    </Link>
  )
}
