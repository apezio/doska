import { useState } from "react"
import {
  imageUnavailable,
  type AttachmentSource,
} from "@doska/core/attachment-labels"
import { useConnection, type Connection } from "@doska/core/sync"

type Status = Connection["status"]

export function useImageFailure(
  hasUrl: boolean,
  source: AttachmentSource = "sync"
): { failed: boolean; onError: () => void } {
  const { status } = useConnection()
  const [failedAt, setFailedAt] = useState<Status | null>(null)

  if (failedAt === "ok" && status === "dropped") setFailedAt(null)

  return {
    failed: imageUnavailable({ source, hasUrl, failedAt, status }),
    onError: () => setFailedAt(status),
  }
}
