import { useConnection } from "@doska/core/sync"
import { Link } from "expo-router"

const LABELS = {
  offline: "Offline",
  auth: "Sign in",
  server: "No server",
} as const

/** The board header's way into sync: what it is doing, and a tap to fix it. */
export function SyncLink() {
  const connection = useConnection()

  const label =
    connection.status === "ok"
      ? "Synced"
      : connection.status === "local"
        ? "Set up sync"
        : LABELS[connection.reason]

  return (
    <Link
      href="/sign-in"
      className={
        connection.status === "dropped"
          ? "text-base text-destructive"
          : "text-base text-primary"
      }
    >
      {label}
    </Link>
  )
}
