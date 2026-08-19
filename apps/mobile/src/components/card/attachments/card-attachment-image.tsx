import { isRenderableImage } from "@doska/core/attachment-mime"
import { useCard } from "@doska/core/queries"
import { cn } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { useState } from "react"
import { Image, Pressable } from "react-native"
import { ROUTES } from "@/lib/routes"
import { AttachmentRow } from "./attachment-row"
import { AttachmentUnavailable } from "./attachment-unavailable"
import { useAttachmentUri } from "./use-attachment-uri"

interface IProps {
  cardId: string
  attachmentKey: string
  alt: string
  /** Fills the card edge to edge, and leaves the tap to the card itself. */
  bleed?: boolean
}

/** An `attachment:<key>` image ref in a card body. */
export function CardAttachmentImage({
  cardId,
  attachmentKey,
  alt,
  bleed,
}: IProps) {
  const { data: card } = useCard(cardId)
  const attachment = card?.attachments?.find((a) => a.key === attachmentKey)
  const { uri, unavailable } = useAttachmentUri(
    cardId,
    attachmentKey,
    attachment?.name ?? alt
  )
  // Only the image itself knows its shape, and only once it has loaded.
  const [ratio, setRatio] = useState(0)

  const open = () =>
    attachment && router.push(ROUTES.cardAttachment(cardId, attachment.id))

  if (attachment && !isRenderableImage(attachment.mime))
    return <AttachmentRow attachment={attachment} onPress={open} />

  if (unavailable) return <AttachmentUnavailable className="h-40" />
  if (!uri) return null

  const image = (
    <Image
      source={{ uri }}
      accessibilityLabel={alt}
      resizeMode={bleed ? "cover" : "contain"}
      onLoad={(e) => {
        const { width, height } = e.nativeEvent.source
        if (height) setRatio(width / height)
      }}
      className={cn("w-full", !bleed && "rounded-md")}
      style={{ aspectRatio: ratio || 16 / 9 }}
    />
  )

  if (bleed) return image

  return (
    <Pressable onPress={open} accessibilityRole="imagebutton">
      {image}
    </Pressable>
  )
}
