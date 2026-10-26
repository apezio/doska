import { Plus } from "lucide-react"
import { buttonVariants, cn } from "@doska/ui-kit"
import { Section } from "../shared/section"
import { useProjectCtx } from "./project-context"
import { SessionCard } from "./session-card"

/** The Claude sessions working on the project, most recently active first. */
export function SessionsSection() {
  const { detail } = useProjectCtx()
  const sessions = [...detail.sessions].sort(
    (a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0)
  )
  const spawns = detail.dashboards

  return (
    <Section
      title="Sessions"
      meta={sessions.length || undefined}
      actions={
        spawns.length > 0 &&
        spawns.map((s) => (
          <a
            key={s.url}
            href={s.spawnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "text-muted-foreground"
            )}
          >
            <Plus />
            {spawns.length > 1 ? `Start on ${s.label}` : "Start session"}
          </a>
        ))
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
