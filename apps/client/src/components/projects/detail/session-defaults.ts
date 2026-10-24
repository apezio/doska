import type { ProjectSession } from "@doska/contract"

export interface SessionDefaults {
  mission: string
  worktree: string
  branch: string
}

/**
 * Prefill for a hand-added session, following Miss Claude's layout: mission
 * <name> lives in <worktrees dir>/<name> on branch claude/<name>. The browser
 * cannot see the box's filesystem, so the worktrees dir is learned from a
 * session already laid out that way; without one the worktree stays blank.
 */
export function sessionDefaults(
  projectName: string,
  sessions: Pick<ProjectSession, "mission" | "worktree" | "branch">[]
): SessionDefaults {
  const base =
    projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "session"
  const taken = new Set(sessions.map((s) => s.mission))
  let mission = base
  for (let n = 2; taken.has(mission); n++) mission = `${base}-${n}`

  const root = sessions
    .map((s) => s.worktree.replace(/\/+$/, ""))
    .find((w, i) => {
      const name = sessions[i].mission || w.slice(w.lastIndexOf("/") + 1)
      return sessions[i].branch === `claude/${name}` && w.endsWith(`/${name}`)
    })
  return {
    mission,
    worktree: root ? `${root.slice(0, root.lastIndexOf("/"))}/${mission}` : "",
    branch: `claude/${mission}`,
  }
}
