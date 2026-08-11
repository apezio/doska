import type { Connection } from "../api/sync"

const UNREACHABLE = {
  offline: "You're offline. Files are stored on the server.",
  auth: "Signed out on the server. Sign in to see files.",
  server: "Can't reach the server. Files are stored there.",
  forbidden: "No access to this file.",
} as const

/**
 * Why an attachment didn't load
 */
export function attachmentUnavailable(connection: Connection): string {
  if (connection.status === "dropped") return UNREACHABLE[connection.reason]
  if (connection.status === "local") return "Sign in to see files."
  return "File unavailable."
}
