import { attachmentUnavailable } from "@doska/core/attachment-labels"
import { isRenderableImage } from "@doska/core/attachment-mime"
import { activeStorage } from "@doska/core/attachments"
import { useUpdateCard } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"
import { useConnection } from "@doska/core/sync"
import type { Attachment } from "@doska/core/types"
import { Loader } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { useState } from "react"
import { Share, Text, View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { AttachmentRow } from "./attachment-row"
import type { PendingUpload } from "./use-attachment-upload"
import { attachmentUri, dropCachedAttachment } from "./use-attachment-uri"

const NO_ATTACHMENTS: Attachment[] = []
const NO_PENDING: PendingUpload[] = []

interface IProps {
  cardId: string
  isReadonly?: boolean
  /** Uploads still in flight, shown greyed at the end. */
  pending?: PendingUpload[]
  /** The upload error, shown under the rows with any of this list's own. */
  uploadError?: string | null
  className?: string
}

/** A card's attachments as a list of named rows. */
export function CardAttachments({
  cardId,
  isReadonly,
  pending = NO_PENDING,
  uploadError,
  className,
}: IProps) {
  const { data: card } = useCard(cardId)
  const { mutate: save } = useUpdateCard(cardId)
  const connection = useConnection()
  const [error, setError] = useState("")

  const attachments = card?.attachments ?? NO_ATTACHMENTS
  if (!attachments.length && !pending.length) return null

  async function remove(att: Attachment) {
    save({ attachments: attachments.filter((a) => a.id !== att.id) })
    dropCachedAttachment(cardId, att.key)
    try {
      await activeStorage().remove(cardId, att.key)
    } catch {
      // Orphaned blob is harmless; the record is what the UI reads.
    }
  }

  async function open(att: Attachment) {
    setError("")
    if (isRenderableImage(att.mime)) {
      router.push(ROUTES.cardAttachment(cardId, att.id))
      return
    }
    // Nothing else on a phone opens a file: the share sheet is the "open in".
    try {
      const uri = await attachmentUri(cardId, att.key, att.name)
      await Share.share({ url: uri, title: att.name })
    } catch {
      setError(attachmentUnavailable(connection))
    }
  }

  const message = error || uploadError

  return (
    <View className={className}>
      {attachments.map((att) => (
        <AttachmentRow
          key={att.id}
          attachment={att}
          onPress={() => void open(att)}
          onRemove={isReadonly ? undefined : () => void remove(att)}
        />
      ))}
      {pending.map((p) => (
        <View key={p.id} className="flex-row items-center gap-2 py-1">
          <Loader size={12} />
          <Text
            numberOfLines={1}
            className="flex-1 text-[13px] text-muted-foreground"
          >
            {p.name}
          </Text>
        </View>
      ))}
      {message ? (
        <Text className="pt-1 text-[13px] text-destructive">{message}</Text>
      ) : null}
    </View>
  )
}
