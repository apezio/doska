import { FileText } from "lucide-react"
import type { Attachment } from "@doska/core/types"
import type { AttachmentSource } from "@doska/core/attachment-labels"
import { AttachmentUnavailable } from "./attachment-unavailable"
import { isRenderableImage } from "./renderable-image"
import { useImageFailure } from "./use-image-failure"

interface IProps {
  attachment: Attachment
  src: string | null
  source?: AttachmentSource
}

export function AttachmentPreview({ attachment, src, source }: IProps) {
  const { failed, onError } = useImageFailure(!!src, source)

  if (isRenderableImage(attachment.mime)) {
    if (failed)
      return (
        <AttachmentUnavailable
          compact
          source={source}
          className="rounded-sm p-1"
        />
      )
    if (src)
      return (
        <img
          src={src}
          alt={attachment.name}
          className="size-full border object-cover"
          draggable={false}
          onError={onError}
        />
      )
  }

  return <FileText className="rounded-sm border p-1 text-muted-foreground" />
}
