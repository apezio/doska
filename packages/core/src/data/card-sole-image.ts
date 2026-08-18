import type { SoleImage } from "@doska/markdown/sole-image"
import type { Attachment } from "../types"
import { isRenderableImage } from "./attachment-mime"

/**
 * The one image a card is, when that is all it is: a body that is a single
 * image and nothing else, or no body and exactly one image attachment.
 */
export function cardSoleImage(
  hasBody: boolean,
  bodyImage: SoleImage | null,
  attachments: Attachment[]
): SoleImage | null {
  if (hasBody) {
    if (!bodyImage) return null
    const shown =
      bodyImage.source.kind === "attachment" ? bodyImage.source.key : null
    return attachments.every((a) => a.key === shown) ? bodyImage : null
  }

  const [only] = attachments
  if (attachments.length !== 1 || !isRenderableImage(only.mime)) return null
  return { source: { kind: "attachment", key: only.key }, alt: only.name }
}
