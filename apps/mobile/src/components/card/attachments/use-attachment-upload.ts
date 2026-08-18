import { useAccount } from "@doska/core/account"
import { activeStorage } from "@doska/core/attachments"
import { useUpdateCard } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"
import { isSyncConfigured } from "@doska/core/server"
import type { Attachment } from "@doska/core/types"
import { useCallback, useState } from "react"
import { v4 as uuid } from "uuid"
import {
  mobileFilePicker,
  mobilePhotoPicker,
} from "@/lib/adapters/mobile-files"

/** Where the files come from: the document picker, or the photo library. */
export type AttachSource = "files" | "photos"

/** A file being uploaded, shown as a greyed row until it is saved. */
export interface PendingUpload {
  id: string
  name: string
}

/**
 * Picking files and putting them on the active storage backend, then appending
 * them to the card. Uploads hit an authed-only server route, so `enabled` needs
 * both a configured backend and a signed-in session.
 */
export function useAttachmentUpload(cardId: string) {
  const { data: card } = useCard(cardId)
  const { mutate: save } = useUpdateCard(cardId)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [error, setError] = useState<string | null>(null)

  const { authed } = useAccount()
  const enabled = isSyncConfigured() && authed
  const existing = card?.attachments

  const disabledReason = enabled
    ? null
    : isSyncConfigured()
      ? "Sign in to attach files"
      : "Connect a sync backend to attach files"

  /** Opens the picker and uploads whatever comes back. */
  const attach = useCallback(
    async (source: AttachSource): Promise<Attachment[]> => {
      if (!enabled) {
        setError(disabledReason)
        return []
      }

      let queued: PendingUpload[] = []
      try {
        const picker =
          source === "photos" ? mobilePhotoPicker : mobileFilePicker
        const files = await picker.pick()
        if (!files.length) return []

        queued = files.map((file) => ({ id: uuid(), name: file.name }))
        setPending((prev) => [...prev, ...queued])
        setError(null)

        const storage = activeStorage()
        const added: Attachment[] = []
        for (let i = 0; i < files.length; i++) {
          const stored = await storage.put(cardId, files[i])
          added.push({
            id: queued[i].id,
            name: files[i].name,
            key: stored.key,
            mime: stored.mime,
            size: stored.size,
          })
        }

        save({ attachments: [...(existing ?? []), ...added] })
        return added
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
        return []
      } finally {
        setPending((prev) => prev.filter((p) => !queued.includes(p)))
      }
    },
    [cardId, enabled, disabledReason, existing, save]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    attach,
    clearError,
    pending,
    busy: pending.length > 0,
    error,
    enabled,
    disabledReason,
  }
}
