import { timeAgo } from "@doska/core/projects"
import { MarkdownField } from "../shared/markdown-field"
import { useProjectWrite } from "../shared/use-project-write"
import { actorLabel, useProjectCtx } from "./project-context"
import { WorkstreamStrip } from "./workstream-strip"

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
          markdownClassName="text-[1.0625rem] leading-[1.65]"
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
