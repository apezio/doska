import {
  Card as CardBase,
  CardAction,
  CardHeader,
  CardTitle,
  MdImage,
  cn,
} from "@doska/ui-kit"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"
import type { SoleImage } from "@doska/markdown"
import type { Attachment } from "@doska/core/types"
import { CardMenu } from "./menu/card-menu"
import { AttachmentImage } from "./attachments/attachment-image"
import { isRenderableImage } from "./attachments/renderable-image"

/** Cancels `MdImage`'s standalone-image spacing so the image can fill the card. */
const FULL_BLEED = "my-0 w-full rounded-none"

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

interface IProps {
  cardId: string
  title: string
  image: SoleImage
  isDragging: boolean
}

/**
 * A card whose whole content is one image
 */
export function ImageCard({ cardId, title, image, isDragging }: IProps) {
  const [, navigate] = useLocation()
  const menu = (
    <CardMenu cardId={cardId} onEdit={() => navigate(routes.card.to(cardId))} />
  )

  return (
    <CardBase
      className={cn(
        "gap-0 py-0",
        title && "pt-2",
        isDragging && "shadow-shade/5 shadow-xl"
      )}
    >
      {title ? (
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          <CardAction className="flex items-center gap-1">{menu}</CardAction>
        </CardHeader>
      ) : (
        <div className="absolute top-1 right-1 z-10 rounded-md bg-card/70 backdrop-blur-sm">
          {menu}
        </div>
      )}
      {image.source.kind === "attachment" ? (
        <AttachmentImage
          cardId={cardId}
          attachmentKey={image.source.key}
          alt={image.alt}
          className={FULL_BLEED}
        />
      ) : (
        <MdImage
          src={image.source.url}
          alt={image.alt}
          className={FULL_BLEED}
        />
      )}
    </CardBase>
  )
}
