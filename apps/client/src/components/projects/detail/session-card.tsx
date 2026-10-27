import { useRef, useState } from "react"
import type { ProjectSessionDetail } from "@doska/contract"
import { cardDisplayId } from "@doska/contract"
import { isLive, timeAgo } from "@doska/core/projects"
import { GitBranch, Maximize2, SquareArrowOutUpRight, X } from "lucide-react"
import { Button, buttonVariants, cn, Hint, Textarea } from "@doska/ui-kit"
import { LiveDot } from "../shared/live-dot"
import { useProjectWrite } from "../shared/use-project-write"
import { WsChip } from "../shared/ws-chip"
import { LINKED_CARD_MIME, type LinkedCardDrag } from "./linked-card-row"
import { useProjectCtx } from "./project-context"

const basename = (path: string) =>
  path.replace(/\/+$/, "").split("/").pop() || path

interface IProps {
  session: ProjectSessionDetail
  /** Off inside a workstream, where the chip would name the parent. */
  showWorkstream?: boolean
}

export function SessionCard({ session: s, showWorkstream = true }: IProps) {
  const { projectId, workstreamById, chatSessionId, openChat } = useProjectCtx()
  const { mutate: remove } = useProjectWrite("sessionRemove", projectId)
  const { mutate: link } = useProjectWrite("cardLink", projectId)
  const frame = useRef<HTMLIFrameElement>(null)
  const [over, setOver] = useState(false)
  const [prompt, setPrompt] = useState<string | null>(null)
  const ws =
    showWorkstream && s.workstreamId ? workstreamById.get(s.workstreamId) : null
  const live = isLive(s.lastActivityAt)

  const send = (text: string) => {
    const win = frame.current?.contentWindow
    if (win && s.chatUrl)
      win.postMessage({ type: "chat-send", text }, new URL(s.chatUrl).origin)
    else openChat(s.id, text)
    setPrompt(null)
  }

  return (
    <li
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(LINKED_CARD_MIME)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "link"
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setOver(false)
      }}
      onDrop={(e) => {
        const raw = e.dataTransfer.getData(LINKED_CARD_MIME)
        if (!raw) return
        e.preventDefault()
        setOver(false)
        const card = JSON.parse(raw) as LinkedCardDrag
        link({
          projectId,
          boardId: card.boardId,
          cardId: card.cardId,
          // Upserts: keep the card's workstream when the session has none.
          workstreamId: s.workstreamId ?? card.workstreamId ?? undefined,
        })
        // Without a chat there is nowhere to send the prompt.
        if (!s.chatUrl) return
        const id = cardDisplayId(card.number)
        setPrompt(`Please pick up card ${id ? `#${id}: ` : ""}"${card.title}"`)
      }}
      className={cn(
        "group/session flex flex-col gap-2 rounded-xl bg-card p-3 shadow-e1 ring-1 ring-foreground/10",
        over && "ring-2 ring-primary"
      )}
    >
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

      {/* Unmounted while the Sheet shows this session, so only one copy polls. */}
      {s.chatUrl && chatSessionId !== s.id && (
        <iframe
          ref={frame}
          key={s.chatUrl}
          src={s.chatUrl}
          title={`Chat with ${s.label || s.mission}`}
          allow="microphone"
          loading="lazy"
          className="h-64 w-full rounded-lg border-0 bg-background [[data-card-drag]_&]:pointer-events-none"
        />
      )}

      {prompt !== null && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPrompt(null)}>
              Just link
            </Button>
            <Button size="sm" onClick={() => send(prompt)}>
              Send
            </Button>
          </div>
        </div>
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
