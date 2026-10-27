import { useCallback, useMemo, useState } from "react"
import { TriangleAlert, UserRound } from "lucide-react"
import { Button, cn } from "@doska/ui-kit"
import { useProject } from "@doska/core/queries"
import { isGone } from "@doska/core/projects"
import { useAuth } from "@/lib/hooks"
import { useLoginPrompt } from "@/providers/login-prompt/login-prompt-context"
import { PageHeader } from "../../app/page-header"
import { CenteredState } from "../../digest/centered-state"
import { useMinWidth } from "../shared/use-min-width"
import { ActivitySection } from "./activity-section"
import { BackLink } from "./back-link"
import { AttentionSection } from "./attention-section"
import { CardsSection } from "./cards-section"
import { ProjectContext, type ProjectCtx } from "./project-context"
import { ProjectHeader } from "./project-header"
import { SessionChat } from "./session-chat"
import { SessionsSection } from "./sessions-section"
import { SummarySection } from "./summary-section"
import { WorkstreamsSection } from "./workstreams-section"

/** Tailwind's `lg`: wide enough for a side column beside the workstreams. */
const WIDE = 1024
/** The docked chat's `w-md`, which the body loses while it is open. */
const CHAT_WIDTH = 448

export function ProjectView({ projectId }: { projectId: string }) {
  const { authed } = useAuth()
  const { data, error, refetch } = useProject(projectId, authed === true)
  const wide = useMinWidth(WIDE)

  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set())
  const setOpen = useCallback((id: string, open: boolean) => {
    setOpenIds((prev) => {
      if (prev.has(id) === open) return prev
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])
  const [chat, setChat] = useState<{ sessionId: string; say?: string }>()
  const openChat = useCallback(
    (sessionId: string | null, say?: string) =>
      setChat(sessionId ? { sessionId, say } : undefined),
    []
  )

  const ctx = useMemo<ProjectCtx | null>(
    () =>
      data && authed === true
        ? {
            detail: data,
            projectId,
            workstreams: [...data.workstreams].sort(
              (a, b) => a.position - b.position
            ),
            workstreamById: new Map(data.workstreams.map((w) => [w.id, w])),
            sessionById: new Map(data.sessions.map((s) => [s.id, s])),
            openIds,
            setOpen,
            chatSessionId: chat?.sessionId ?? null,
            chatSay: chat?.say,
            openChat,
          }
        : null,
    [data, authed, projectId, openIds, setOpen, chat, openChat]
  )

  if (ctx) {
    const docked =
      wide &&
      !!ctx.chatSessionId &&
      !!ctx.sessionById.get(ctx.chatSessionId)?.chatUrl
    return (
      <ProjectContext value={ctx}>
        <div className="flex h-full min-h-0">
          <div className="flex min-w-0 flex-1 flex-col">
            <ProjectHeader />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ProjectBody docked={docked} />
            </div>
          </div>
          <SessionChat docked={docked} />
        </div>
      </ProjectContext>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader>
        <BackLink />
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {authed === false ? (
          <SignedOut />
        ) : error ? (
          <CenteredState
            icon={<TriangleAlert className="size-8 text-destructive" />}
          >
            <p className="max-w-sm text-sm text-muted-foreground">
              {isGone(error)
                ? "This project was deleted, or it belongs to another account."
                : "Couldn't reach the server. Projects live on your account, so they need a connection."}
            </p>
            {!isGone(error) && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            )}
          </CenteredState>
        ) : null}
      </div>
    </div>
  )
}

function ProjectBody({ docked }: { docked: boolean }) {
  const wide = useMinWidth(docked ? WIDE + CHAT_WIDTH : WIDE)
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-6 pb-20 md:px-6">
      <SummarySection />
      <div
        className={cn(
          "grid gap-10",
          wide && "grid-cols-[minmax(0,1fr)_22rem] gap-12"
        )}
      >
        <div className="flex min-w-0 flex-col gap-10">
          {!wide && <AttentionSection />}
          <WorkstreamsSection />
          <CardsSection />
          {!wide && <SessionsSection />}
        </div>
        <div className="flex min-w-0 flex-col gap-10">
          {wide && <AttentionSection />}
          {wide && <SessionsSection />}
          <ActivitySection />
        </div>
      </div>
    </div>
  )
}

function SignedOut() {
  const openLogin = useLoginPrompt()
  return (
    <CenteredState
      icon={<UserRound className="size-8 text-muted-foreground" />}
    >
      <p className="max-w-sm text-sm text-muted-foreground">
        Projects live on your account. Sign in to open this one.
      </p>
      <Button size="sm" onClick={openLogin}>
        Sign in
      </Button>
    </CenteredState>
  )
}
