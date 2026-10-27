import type { ProjectSessionDetail } from "@doska/contract"
import { isLive } from "@doska/core/projects"
import { cn } from "@doska/ui-kit"
import { LiveDot } from "../shared/live-dot"
import { hoverProps, type LinkHover, useLinkHover } from "./link-hover"
import { sessionName } from "./project-context"

const SHOWN = 2

/** The sessions working on an item. `parent` is the hover to fall back to on
 * leaving a badge, since the item's own row is still under the pointer. */
export function SessionBadges({
  sessions,
  parent,
}: {
  sessions: ProjectSessionDetail[]
  parent: LinkHover
}) {
  const { setHover } = useLinkHover()
  if (sessions.length === 0) return null
  const shown = sessions.slice(0, SHOWN)
  const rest = sessions.slice(SHOWN)

  return (
    <span className="inline-flex min-w-0 shrink items-center gap-1">
      {shown.map((s) => {
        const live = isLive(s.lastActivityAt)
        return (
          <span
            key={s.id}
            {...hoverProps(setHover, { session: s.id }, parent)}
            title={`Session ${sessionName(s)}`}
            className={cn(
              "inline-flex h-5 max-w-28 min-w-0 items-center gap-1 rounded-full px-1.5 text-xs",
              live
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {live && <LiveDot className="shrink-0" />}
            <span className="truncate">{sessionName(s)}</span>
          </span>
        )
      })}
      {rest.length > 0 && (
        <span
          title={rest.map(sessionName).join(", ")}
          className="inline-flex h-5 shrink-0 items-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums"
        >
          +{rest.length}
        </span>
      )}
    </span>
  )
}
