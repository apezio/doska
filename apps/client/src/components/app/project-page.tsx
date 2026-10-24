import { useEffect } from "react"
import { sync } from "@doska/core/sync"
import { ProjectView } from "@/components/projects/detail/project-view"
import { AppShell } from "./app-shell"

const NO_DECK = { id: "", sort: [] }

/** One project, at `/projects/:id`. */
export function ProjectPage({ projectId }: { projectId: string }) {
  useEffect(() => {
    sync.setActiveBoard(null)
  }, [])

  return (
    <AppShell deck={NO_DECK}>
      <ProjectView key={projectId} projectId={projectId} />
    </AppShell>
  )
}
