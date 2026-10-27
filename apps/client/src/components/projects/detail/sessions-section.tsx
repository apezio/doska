import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { LoaderCircle, Plus } from "lucide-react"
import { buttonVariants, cn } from "@doska/ui-kit"
import type { ProjectDetail } from "@doska/contract"
import { keys } from "@doska/core/keys"
import { Section } from "../shared/section"
import { notify } from "../shared/notify"
import { useProjectCtx } from "./project-context"
import { SessionCard } from "./session-card"
import { startSession } from "./start-session"

type Dashboard = ProjectDetail["dashboards"][number]

/** How long, and how often, to refetch the project after a start so the new
 * session shows up once Claude registers it. */
const WATCH_MS = 2 * 60_000
const WATCH_EVERY_MS = 5_000

const linkClass = "font-medium underline underline-offset-2"

/** The Claude sessions working on the project, most recently active first. */
export function SessionsSection() {
  const { detail, projectId } = useProjectCtx()
  const qc = useQueryClient()
  const sessions = [...detail.sessions].sort(
    (a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0)
  )
  const spawns = detail.dashboards
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())
  // A start bumps the token; the poll below runs while polls are left.
  const [watch, setWatch] = useState(0)
  const pollsLeft = useRef(0)
  const baseline = useRef(0)

  // Poll after a start until a new session joins or the window runs out.
  const count = detail.sessions.length
  useEffect(() => {
    if (watch === 0 || count > baseline.current) return
    const timer = setInterval(() => {
      if (pollsLeft.current <= 0) return clearInterval(timer)
      pollsLeft.current--
      void qc.invalidateQueries({ queryKey: keys.project(projectId) })
    }, WATCH_EVERY_MS)
    return () => clearInterval(timer)
  }, [watch, count, qc, projectId])

  const start = async (s: Dashboard) => {
    setPending((prev) => new Set(prev).add(s.url))
    const result = await startSession(s.url, projectId)
    setPending((prev) => {
      const next = new Set(prev)
      next.delete(s.url)
      return next
    })
    const id = `session-start-${s.url}`
    if (result.kind === "ok") {
      notify(
        id,
        `Started ${result.name} on ${s.label} — it joins here when Claude registers.`
      )
      baseline.current = count
      pollsLeft.current = WATCH_MS / WATCH_EVERY_MS
      setWatch((n) => n + 1)
    } else if (result.kind === "login") {
      notify(
        id,
        <>
          {result.msg}{" "}
          <a
            href={`${s.url}/`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Log in on {s.label}
          </a>
        </>,
        10_000
      )
    } else {
      notify(
        id,
        <>
          {result.msg}{" "}
          <a
            href={s.spawnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Open start dialog
          </a>
        </>,
        10_000
      )
    }
  }

  return (
    <Section
      title="Sessions"
      meta={sessions.length || undefined}
      actions={
        spawns.length > 0 &&
        spawns.map((s) => {
          const busy = pending.has(s.url)
          return (
            <button
              key={s.url}
              type="button"
              disabled={busy}
              onClick={() => void start(s)}
              className={cn(
                buttonVariants({ size: "sm", variant: "ghost" }),
                "text-muted-foreground"
              )}
            >
              {busy ? <LoaderCircle className="animate-spin" /> : <Plus />}
              {busy
                ? "Starting…"
                : spawns.length > 1
                  ? `Start on ${s.label}`
                  : "Start session"}
            </button>
          )
        })
      }
    >
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sessions yet. A session started here, or any Claude session that
          calls session_start on the project, joins it on its own.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </ul>
      )}
    </Section>
  )
}
