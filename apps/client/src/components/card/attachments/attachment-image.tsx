import { useState } from "react"
import { useCard } from "@doska/core/queries"
import { cn, MdImage } from "@doska/ui-kit"
import { useAttachmentUrlByKey } from "@/lib/hooks/use-attachment-url"
import { AttachmentViewer } from "./attachment-viewer"

interface IProps {
  cardId: string
  attachmentKey: string
  alt: string
  className?: string
}

/** Renders a body image ref by resolving its storage URL; nothing until resolved. */
export function AttachmentImage({
  cardId,
  attachmentKey,
  alt,
  className,
}: IProps) {
  const url = useAttachmentUrlByKey(cardId, attachmentKey)
  const { data: card } = useCard(cardId)
  const [viewing, setViewing] = useState(false)

  if (!url) return null

  const attachment = card?.attachments?.find((a) => a.key === attachmentKey)

  return (
    <>
      <MdImage
        src={url}
        alt={alt}
        className={cn("cursor-zoom-in", className)}
        onClick={(e) => {
          if (!attachment) return
          e.stopPropagation()
          setViewing(true)
        }}
      />
      {attachment && (
        <AttachmentViewer
          cardId={cardId}
          attachment={viewing ? attachment : null}
          onClose={() => setViewing(false)}
        />
      )}
    </>
  )
}
