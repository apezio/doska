import { useEffect } from "react"
import { sync } from "@doska/core/sync"
import { ProjectsOverview } from "@/components/projects/overview/projects-overview"
import { AppShell } from "./app-shell"

const NO_DECK = { id: "", sort: [] }

/** Every project on the account, at `/projects`. */
export function ProjectsPage() {
  useEffect(() => {
    sync.setActiveBoard(null)
  }, [])

  return (
    <AppShell deck={NO_DECK}>
      <ProjectsOverview />
    </AppShell>
  )
}
