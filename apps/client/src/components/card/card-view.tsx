import {
  Card as CardBase,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  MdImage,
  cn,
} from "@doska/ui-kit"
import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react"
import { cut, soleImage, useMarkers, type SoleImage } from "@doska/markdown"
import type { Card, Column } from "@doska/core/types"
import { MarkdownCardPreview } from "../markdown"
import { CardMeta } from "./card-meta"
import { ImageCard } from "./image-card"
import { cardSoleImage } from "./sole-image"

const BOARD_MARKERS = [cut]

/** Cancels `MdImage`'s standalone-image spacing so the image can fill the card. */
const FULL_BLEED = "my-0 w-full rounded-none"

interface IProps extends DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> {
  card: Card
  column?: Column | null
  prefix: string
  showBody: boolean
  isDragging?: boolean
  /** Top-right slot: the card menu where the viewer can act on the card. */
  action?: ReactNode
  /** Omit to leave the body's task checkboxes inert. */
  onChangeBody?: (body: string) => void
  onChangeDeadline?: (deadline: string | null) => void
  /** The card's attachments, drawn by whoever can resolve their URLs. */
  attachments?: ReactNode
  /** Draws an `attachment:<key>` image; the app and a public board find it differently. */
  renderAttachmentImage: (
    key: string,
    alt: string,
    className: string
  ) => ReactNode
  /**
   * Wraps the card itself, inside the outer element. The outer one holds the
   * drag ref and must stay outermost, so a context menu has to go here.
   */
  wrapCard?: (card: ReactNode) => ReactNode
}

/** A board card. Everything it cannot resolve itself arrives as a prop. */
export function CardView({
  card,
  column,
  prefix,
  showBody,
  isDragging,
  action,
  onChangeBody,
  onChangeDeadline,
  attachments,
  renderAttachmentImage,
  wrapCard = (card) => card,
  ...props
}: IProps) {
  const { title, body } = card
  const { body: preview, applied } = useMarkers(body, BOARD_MARKERS, "card")
  const hasBody = preview.trim().length > 0
  const hasMore = applied.includes(cut.name)
  const files = card.attachments ?? []
  const bodyImage = hasBody && !hasMore ? soleImage(preview) : null
  const image = cardSoleImage(hasBody, bodyImage, files)

  const drawImage = (image: SoleImage) =>
    image.source.kind === "attachment" ? (
      renderAttachmentImage(image.source.key, image.alt, FULL_BLEED)
    ) : (
      <MdImage src={image.source.url} alt={image.alt} className={FULL_BLEED} />
    )

  return (
    <div
      {...props}
      className={cn(
        "group relative mb-3 w-full max-w-sm cursor-pointer rounded-lg",
        "touch-manipulation select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      )}
    >
      {wrapCard(
        image ? (
          <ImageCard title={title} isDragging={isDragging} action={action}>
            {drawImage(image)}
          </ImageCard>
        ) : (
          <CardBase className={cn(isDragging && "shadow-shade/5 shadow-xl")}>
            <CardHeader>
              <CardTitle>{title || "Untitled card"}</CardTitle>
              {action && (
                <CardAction className="flex items-center gap-1">
                  {action}
                </CardAction>
              )}
            </CardHeader>
            <CardContent className={cn(!showBody && hasBody && "-mb-2")}>
              <CardMeta
                card={card}
                column={column}
                prefix={prefix}
                onChangeDeadline={onChangeDeadline}
                className="mt-2"
              />
            </CardContent>

            {hasBody && (
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  showBody ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <CardContent className="space-y-3 pt-2">
                    <MarkdownCardPreview
                      preview={preview}
                      body={body}
                      hasMore={hasMore}
                      onChangeBody={onChangeBody}
                    />
                  </CardContent>
                </div>
              </div>
            )}
            {files.length > 0 && showBody && attachments}
          </CardBase>
        )
      )}
    </div>
  )
}
