import type { ProjectSessionDetail } from "@doska/contract"
import { isLive, timeAgo } from "@doska/core/projects"
import { GitBranch, SquareArrowOutUpRight, X } from "lucide-react"
import { Button, buttonVariants, cn, Hint } from "@doska/ui-kit"
import { LiveDot } from "../shared/live-dot"
import { useProjectWrite } from "../shared/use-project-write"
import { WsChip } from "../shared/ws-chip"
import { useProjectCtx } from "./project-context"

const basename = (path: string) =>
  path.replace(/\/+$/, "").split("/").pop() || path

interface IProps {
  session: ProjectSessionDetail
  /** Off inside a workstream, where the chip would name the parent. */
  showWorkstream?: boolean
}

export function SessionCard({ session: s, showWorkstream = true }: IProps) {
  const { projectId, workstreamById } = useProjectCtx()
  const { mutate: remove } = useProjectWrite("sessionRemove", projectId)
  const ws =
    showWorkstream && s.workstreamId ? workstreamById.get(s.workstreamId) : null
  const live = isLive(s.lastActivityAt)

  return (
    <li className="group/session flex flex-col gap-2 rounded-xl bg-card p-3 shadow-e1 ring-1 ring-foreground/10">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {live && <LiveDot />}
            <span className="truncate">{s.label || basename(s.worktree)}</span>
          </p>
          {s.mission && s.mission !== basename(s.worktree) && (
            <p className="truncate text-xs text-muted-foreground">
              {s.mission}
            </p>
          )}
        </div>
        <Hint label="Remove session">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove session"
            className="-mt-1 -mr-1 size-6 text-muted-foreground md:opacity-0 md:group-hover/session:opacity-100 md:focus-visible:opacity-100"
            onClick={() => remove({ id: s.id })}
          >
            <X className="size-3.5" />
          </Button>
        </Hint>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span
          className="inline-flex min-w-0 items-center gap-1"
          title={s.worktree}
        >
          <GitBranch className="size-3.5 shrink-0" />
          <span className="truncate">
            {basename(s.worktree)}
            {s.branch && (
              <span className="text-foreground/70"> on {s.branch}</span>
            )}
          </span>
        </span>
        {ws && <WsChip name={ws.name} />}
      </div>

      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {s.lastActivityAt
            ? `${s.lastEvent ? `${s.lastEvent}, ` : ""}${timeAgo(s.lastActivityAt)}`
            : "No activity yet"}
        </span>
        <OpenSession url={s.openUrl} />
      </div>
    </li>
  )
}

function OpenSession({ url }: { url: string | null }) {
  const className = cn(
    buttonVariants({ size: "sm", variant: "secondary" }),
    "shrink-0"
  )
  if (url)
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <SquareArrowOutUpRight />
        Open session
      </a>
    )
  return (
    <Hint label="Set MISS_CLAUDE_URL on the server">
      {/* A disabled button gets no pointer events, so the hint hangs on this. */}
      <span
        tabIndex={0}
        className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Button size="sm" variant="secondary" disabled className="shrink-0">
          <SquareArrowOutUpRight />
          Open session
        </Button>
      </span>
    </Hint>
  )
}
