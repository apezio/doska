import { useRef, useState } from "react"
import type { ProjectSessionDetail } from "@doska/contract"
import { cardDisplayId } from "@doska/contract"
import { isLive, timeAgo } from "@doska/core/projects"
import {
  ChevronRight,
  GitBranch,
  Maximize2,
  SquareArrowOutUpRight,
  X,
} from "lucide-react"
import { Button, buttonVariants, cn, Hint } from "@doska/ui-kit"
import { LiveDot } from "../shared/live-dot"
import { useProjectWrite } from "../shared/use-project-write"
import { ChatFrame } from "./chat-frame"
import { dragKind, readDrag } from "./drag"
import { hoverProps, sessionLit, useLinkHover } from "./link-hover"
import {
  basename,
  revealWorkstream,
  sessionName,
  useProjectCtx,
} from "./project-context"

interface IProps {
  session: ProjectSessionDetail
  /** Off inside a workstream, where naming it again would only repeat the
   * parent. That copy also draws no connector line: it sits by its item. */
  showWorkstream?: boolean
}

export function SessionCard({ session: s, showWorkstream = true }: IProps) {
  const { projectId, chatSessionId, openChat } = useProjectCtx()
  const { hover, setHover } = useLinkHover()
  const { mutate: remove } = useProjectWrite("sessionRemove", projectId)
  const { mutate: link } = useProjectWrite("cardLink", projectId)
  const { mutate: register } = useProjectWrite("sessionRegister", projectId)
  const frame = useRef<HTMLIFrameElement>(null)
  const [over, setOver] = useState(false)
  const live = isLive(s.lastActivityAt)

  const send = (text: string) => {
    const win = frame.current?.contentWindow
    if (win && s.chatUrl)
      win.postMessage({ type: "chat-send", text }, new URL(s.chatUrl).origin)
    else openChat(s.id, text)
  }

  return (
    <li
      onDragOver={(e) => {
        const kind = dragKind(e)
        if (!kind) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "link"
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setOver(false)
      }}
      onDrop={(e) => {
        const drag = readDrag(e)
        if (!drag) return
        e.preventDefault()
        setOver(false)
        let say: string
        switch (drag.kind) {
          case "card": {
            link({
              projectId,
              boardId: drag.boardId,
              cardId: drag.cardId,
              // Upserts: keep the card's workstream when the session has none.
              workstreamId: s.workstreamId ?? drag.workstreamId ?? undefined,
            })
            const id = cardDisplayId(drag.number)
            say = `Please pick up card ${id ? `#${id}: ` : ""}"${drag.title}"`
            break
          }
          case "workstream":
            register({
              projectId,
              worktree: s.worktree,
              workstreamId: drag.id,
              stepId: null,
            })
            say = `Please work on workstream "${drag.name}".`
            break
          case "step":
            register({
              projectId,
              worktree: s.worktree,
              workstreamId: drag.workstreamId,
              stepId: drag.stepId,
            })
            say = `Please do this step of workstream "${drag.workstreamName}": ${drag.text}`
        }
        // Without a chat there is nowhere to send the prompt.
        if (s.chatUrl) send(say)
      }}
      {...hoverProps(setHover, { session: s.id })}
      data-link-session={showWorkstream ? s.id : undefined}
      className={cn(
        "group/session flex flex-col gap-2 rounded-xl bg-card p-3 shadow-e1 ring-1 ring-foreground/10 transition-shadow",
        sessionLit(hover, s) && "ring-2 ring-primary/50",
        over && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {live && <LiveDot />}
            <span className="truncate">{sessionName(s)}</span>
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
        <WorkingOn session={s} showWorkstream={showWorkstream} />
      </div>

      {/* Unmounted while the chat panel shows this session, so only one copy polls. */}
      {s.chatUrl && chatSessionId !== s.id && (
        <ChatFrame
          ref={frame}
          key={s.chatUrl}
          src={s.chatUrl}
          title={`Chat with ${s.label || s.mission}`}
          allow="microphone; autoplay"
          loading="lazy"
          className="h-72 w-full rounded-lg [[data-card-drag]_&]:pointer-events-none"
        />
      )}

      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {s.lastActivityAt
            ? `${s.lastEvent ? `${s.lastEvent}, ` : ""}${timeAgo(s.lastActivityAt)}`
            : "No activity yet"}
        </span>
        <RunsOn session={s} />
        {s.chatUrl && (
          <Hint label="Expand chat">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label="Expand chat"
              className="shrink-0"
              onClick={() => openChat(s.id)}
            >
              <Maximize2 />
            </Button>
          </Hint>
        )}
        <OpenSession url={s.openUrl} />
      </div>
    </li>
  )
}

/** The workstream, and step, the session works on. */
function WorkingOn({
  session: s,
  showWorkstream,
}: {
  session: ProjectSessionDetail
  showWorkstream: boolean
}) {
  const ctx = useProjectCtx()
  const ws = s.workstreamId ? ctx.workstreamById.get(s.workstreamId) : null
  const step = ws?.steps.find((st) => st.id === s.stepId)
  if (!ws || (!showWorkstream && !step)) return null
  const stepText = step && <span className="truncate">{step.text}</span>
  if (!showWorkstream)
    return (
      <span className="inline-flex max-w-full min-w-0 rounded-md border px-1.5 py-px">
        {stepText}
      </span>
    )
  return (
    <button
      type="button"
      title={step ? `${ws.name} › ${step.text}` : ws.name}
      onClick={() => revealWorkstream(ctx, ws.id)}
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-0.5 rounded-md border px-1.5 py-px text-left",
        "outline-none hover:border-foreground/25 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
    >
      <span className={cn("truncate", step && "max-w-32 shrink-0")}>
        {ws.name}
      </span>
      {step && (
        <>
          <ChevronRight className="size-3 shrink-0" />
          {stepText}
        </>
      )}
    </button>
  )
}

/** Which Miss Claude the session runs under, as the session reported it. */
function RunsOn({ session: s }: { session: ProjectSessionDetail }) {
  const { detail } = useProjectCtx()
  const url = s.dashboardUrl.replace(/\/+$/, "")
  if (!url || detail.dashboards.length < 2) return null
  const label =
    detail.dashboards.find((d) => d.url === url)?.label ??
    new URL(url).hostname.split(".")[0]
  return (
    <span className="shrink-0 text-xs text-muted-foreground">on {label}</span>
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
