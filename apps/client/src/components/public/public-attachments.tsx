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

  const urls = Object.fromEntries(
    attachments.map((a) => [a.key, publicAttachmentUrl(token, a.key)])
  )

  return (
    <>
      <AttachmentList
        attachments={attachments}
        urls={urls}
        className={className}
        onOpen={(att) => {
          if (isRenderableImage(att.mime)) setViewing(att)
          else window.open(urls[att.key], "_blank")
        }}
      />
      <AttachmentViewer
        attachment={viewing}
        src={viewing ? urls[viewing.key] : null}
        onClose={() => setViewing(null)}
        onDownload={() => viewing && window.open(urls[viewing.key], "_blank")}
      />
    </>
  )
}
