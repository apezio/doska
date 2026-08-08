import { useConnection, type Connection } from "../api/sync"
import type { Session } from "../api/auth"
import { useSession } from "./queries"

const DROPPED = {
  offline: "Offline",
  auth: "Signed out on the server",
  server: "No server",
  forbidden: "No access",
} as const

// `session` is undefined until the first check resolves; a neutral placeholder
// keeps the wrong identity from flashing.
function nameFor(session: Session | undefined): string {
  if (!session) return "…"
  if (!session.authed) return "Not signed in"
  return session.login ?? "Signed in"
}

function subtitleFor(connection: Connection): string {
  if (connection.status === "ok") return "Syncing"
  if (connection.status === "local") return "Sign in to sync"
  return DROPPED[connection.reason]
}

export interface Account {
  session: Session | undefined
  name: string
  subtitle: string
  /** Sync is down, so the subtitle names a failure rather than a state. */
  dropped: boolean
}

/** Who is signed in and what sync is doing, as the sidebar states it. */
export function useAccount(): Account {
  const { data: session } = useSession()
  const connection = useConnection()

  return {
    session,
    name: nameFor(session),
    subtitle: subtitleFor(connection),
    dropped: connection.status === "dropped",
  }
}
