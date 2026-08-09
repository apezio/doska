import { fallbackCard } from "@doska/core/seed"
import { useCard, useCardCol } from "@doska/core/queries"
import { useUpdateCard } from "@doska/core/mutations"
import { useLocation } from "wouter"
import type { DetailedHTMLProps, HTMLAttributes } from "react"
import { routes } from "@/lib/routes"
import { useDeckPrefix } from "../deck/deck-context"
import { CardAttachments } from "./attachments/card-attachments"
import { CardAttachmentImage } from "./attachments/card-attachment-image"
import { CardContextMenu, CardMenu } from "./menu/card-menu"
import { CardMarkdown } from "./card-markdown"
import { CardView } from "./card-view"

interface IProps extends DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> {
  id: string
  showBody: boolean
  isDragging: boolean
}

export function Card({ id, showBody, isDragging, ...props }: IProps) {
  const [, navigate] = useLocation()
  const prefix = useDeckPrefix()
  const { data: card = fallbackCard } = useCard(id)
  const { data: column } = useCardCol(id)
  const { mutate: updateCard } = useUpdateCard(id)

  const open = () => navigate(routes.card.to(id))

  return (
    <CardMarkdown cardId={id}>
      <CardView
        {...props}
        wrapCard={(inner) => (
          <CardContextMenu cardId={id} onEdit={open}>
            {inner}
          </CardContextMenu>
        )}
        card={card}
        column={column}
        prefix={prefix}
        showBody={showBody}
        isDragging={isDragging}
        action={<CardMenu cardId={id} onEdit={open} />}
        onChangeBody={(body) => updateCard({ body })}
        onChangeDeadline={(deadline) => updateCard({ deadline })}
        attachments={
          <CardAttachments className="pt-2" cardId={id} isReadonly />
        }
        renderAttachmentImage={(key, alt, className) => (
          <CardAttachmentImage
            cardId={id}
            attachmentKey={key}
            alt={alt}
            className={className}
          />
        )}
      />
    </CardMarkdown>
  )
}
