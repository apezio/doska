import { FileText } from "lucide-react"
import type { Attachment } from "@doska/core/types"
import { AttachmentUnavailable } from "./attachment-unavailable"
import { isRenderableImage } from "./renderable-image"
import { useImageFailure } from "./use-image-failure"

interface IProps {
  attachment: Attachment
  src: string | null
}

export function AttachmentPreview({ attachment, src }: IProps) {
  const { failed, status, onError } = useImageFailure()

  if (!isRenderableImage(attachment.mime))
    return <FileText className="rounded-sm border p-1 text-muted-foreground" />

  if (failed || (!src && status !== "ok"))
    return <AttachmentUnavailable compact className="rounded-sm p-1" />

  if (!src) return null

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
