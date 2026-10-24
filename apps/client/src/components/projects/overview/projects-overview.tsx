import { useMemo, useState } from "react"
import { Compass, Plus, TriangleAlert, UserRound } from "lucide-react"
import { Button } from "@doska/ui-kit"
import { useProjects } from "@doska/core/queries"
import { groupProjects, type ProjectGroupId } from "@doska/core/projects"
import { useAuth } from "@/lib/hooks"
import { useLoginPrompt } from "@/providers/login-prompt/login-prompt-context"
import { PageHeader } from "../../app/page-header"
import { CenteredState } from "../../digest/centered-state"
import { NewProjectModal } from "./new-project-modal"
import { ProjectTile } from "./project-tile"

const GROUP_TITLE: Record<ProjectGroupId, string> = {
  attention: "Needs you",
  moving: "In motion",
  resting: "Paused and done",
}

/** Every project, with what waits on its owner first. */
export function ProjectsOverview() {
  const { authed } = useAuth()
  const [creating, setCreating] = useState(false)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader>
        <h1 className="text-base font-semibold">Projects</h1>
        {authed && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => setCreating(true)}
          >
            <Plus />
            New project
          </Button>
        )}
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-16">
        <div className="mx-auto max-w-5xl">
          {authed === false ? (
            <SignedOut />
          ) : authed ? (
            <Body onCreate={() => setCreating(true)} />
          ) : null}
        </div>
      </div>
      <NewProjectModal open={creating} onOpenChange={setCreating} />
    </div>
  )
}

function Body({ onCreate }: { onCreate: () => void }) {
  const { data, error, isPending, refetch } = useProjects(true)
  const groups = useMemo(() => groupProjects(data ?? []), [data])

  if (error)
    return (
      <CenteredState
        icon={<TriangleAlert className="size-8 text-destructive" />}
      >
        <p className="max-w-sm text-sm text-muted-foreground">
          Couldn't reach the server. Projects live on your account, not on this
          device, so they need a connection.
        </p>
        <Button size="sm" variant="secondary" onClick={() => void refetch()}>
          Try again
        </Button>
      </CenteredState>
    )

  if (isPending) return null

  if (groups.length === 0)
    return (
      <CenteredState
        icon={<Compass className="size-8 text-muted-foreground" />}
      >
        <div className="flex max-w-sm flex-col gap-1">
          <p className="font-semibold">No projects yet</p>
          <p className="text-sm text-muted-foreground">
            A project keeps the workstreams, open decisions and Claude sessions
            behind one goal in one place.
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus />
          New project
        </Button>
      </CenteredState>
    )

  return (
    <div className="flex flex-col gap-9">
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`group-${g.id}`}>
          <h2
            id={`group-${g.id}`}
            className="mb-3 flex items-baseline gap-2 text-sm font-semibold tracking-heading"
          >
            {GROUP_TITLE[g.id]}
            <span className="font-normal text-muted-foreground tabular-nums">
              {g.projects.length}
            </span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.projects.map((p) => (
              <li key={p.id} className="grid min-w-0">
                <ProjectTile project={p} />
              </li>
            ))}
          </ul>
        </section>
      ))}
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
        Projects live on your account. Sign in to see and plan them.
      </p>
      <Button size="sm" onClick={openLogin}>
        Sign in
      </Button>
    </CenteredState>
  )
}
