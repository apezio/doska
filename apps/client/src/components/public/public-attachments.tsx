import { useState } from "react"
import type { Attachment } from "@doska/core/types"
import { publicAttachmentUrl } from "@doska/core/public"
import { AttachmentList } from "../card/attachments/attachment-list"
import { AttachmentViewer } from "../card/attachments/attachment-viewer"
import { isRenderableImage } from "../card/attachments/renderable-image"

interface IProps {
  attachments: Attachment[]
  token: string
  className?: string
}

/** A card's attachments on a public board: every URL is the token's to serve. */
export function PublicAttachments({ attachments, token, className }: IProps) {
  const [viewing, setViewing] = useState<Attachment | null>(null)

  const urlFor = (att: Attachment) => publicAttachmentUrl(token, att.key)

  return (
    <>
      <AttachmentList
        attachments={attachments}
        className={className}
        onOpen={(att) => {
          if (isRenderableImage(att.mime)) setViewing(att)
          else window.open(urlFor(att), "_blank")
        }}
      />
      <AttachmentViewer
        attachment={viewing}
        src={viewing ? urlFor(viewing) : null}
        source="token"
        onClose={() => setViewing(null)}
        onDownload={() => {
          if (viewing) window.open(urlFor(viewing), "_blank")
        }}
      />
    </>
  )
}
