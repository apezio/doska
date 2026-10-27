import { createContext, useContext } from "react"
import type {
  ProjectDetail,
  ProjectSessionDetail,
  Workstream,
} from "@doska/contract"

export interface ProjectCtx {
  detail: ProjectDetail
  projectId: string
  /** By position, the order the project lays them out in. */
  workstreams: Workstream[]
  workstreamById: Map<string, Workstream>
  sessionById: Map<string, ProjectSessionDetail>
  /** Workstreams shown expanded. */
  openIds: ReadonlySet<string>
  setOpen: (id: string, open: boolean) => void
  /** The session whose Miss Claude chat is showing, if any. */
  chatSessionId: string | null
  /** Text to send into that chat once it loads, then cleared. */
  chatSay: string | undefined
  openChat: (sessionId: string | null, say?: string) => void
}

export const ProjectContext = createContext<ProjectCtx | null>(null)

export function useProjectCtx(): ProjectCtx {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProjectCtx must be used within a project page")
  return ctx
}

export const basename = (path: string) =>
  path.replace(/\/+$/, "").split("/").pop() || path

export const sessionName = (s: ProjectSessionDetail) =>
  s.label || basename(s.worktree)

export function revealWorkstream(ctx: Pick<ProjectCtx, "setOpen">, id: string) {
  ctx.setOpen(id, true)
  document
    .getElementById(`ws-${id}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" })
}

/** Who made a write, in the words the activity log uses. */
export function actorLabel(
  ctx: ProjectCtx,
  e: { sessionId: string | null; actor: "user" | "mcp" },
  midSentence = false
): string {
  const session = e.sessionId ? ctx.sessionById.get(e.sessionId) : undefined
  if (session) return session.label || "a session"
  if (e.actor === "mcp") return "Claude"
  return midSentence ? "you" : "You"
}
