import { useState } from "react"
import { useConnection, type Connection } from "@doska/core/sync"

type Status = Connection["status"]

function stillFailed(failedAt: Status | null, status: Status): boolean {
  if (failedAt === null) return false
  // Sync was healthy when it failed, so the object itself is gone.
  if (failedAt === "ok") return true
  // It failed during an outage; once sync is back the image is worth another go.
  return status !== "ok"
}

export function useImageFailure(): {
  failed: boolean
  status: Status
  onError: () => void
} {
  const { status } = useConnection()
  const [failedAt, setFailedAt] = useState<Status | null>(null)

  return {
    failed: stillFailed(failedAt, status),
    status,
    onError: () => setFailedAt(status),
  }
}
