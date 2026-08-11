import { cn } from "@doska/ui-kit"
import type { Attachment } from "@doska/core/types"
import type { AttachmentSource } from "@doska/core/attachment-labels"
import { AttachmentPreview } from "./attachment-preview"

interface IProps {
  attachment: Attachment
  /** Resolved by the caller; null while it is still resolving or on failure. */
  src: string | null
  source?: AttachmentSource
  className?: string
  onOpen?: () => void
}

/** A small square preview: image thumbnail, or a file icon with its extension. */
export function AttachmentTile({
  attachment,
  src,
  source,
  className,
  onOpen,
}: IProps) {
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => e.key === "Enter" && onOpen() : undefined}
      title={attachment.name}
      className={cn(
        "relative aspect-square overflow-hidden rounded-sm",
        "flex items-center justify-center",
        onOpen && "cursor-pointer",
        className
      )}
    >
      <AttachmentPreview attachment={attachment} src={src} source={source} />
    </div>
  )
}
