import { MarkdownRenderersProvider } from "@doska/markdown"
import { useMemo, type ReactNode } from "react"
import { CardAttachmentImage } from "./attachments/card-attachment-image"
import { CardRefLink } from "./refs/card-ref-link"

interface IProps {
  cardId: string
  /** The board the references resolve against — `[[ROAD-12]]` names a card on
   * the same board, so this is as wide as a reference can reach. */
  deckId: string
  prefix: string
  children: ReactNode
}

/**
 * Resolves the parts of a card body that need app data: `attachment:<key>`
 * image refs, and `[[ROAD-12]]` card refs.
 */
export function CardMarkdown({ cardId, deckId, prefix, children }: IProps) {
  const renderers = useMemo(
    () => ({
      renderImage: (key: string, alt: string) => (
        <CardAttachmentImage cardId={cardId} attachmentKey={key} alt={alt} />
      ),
      // Until the card's board has resolved there is nothing to resolve refs
      // against, and they render as the plain text they already are.
      renderWikilink: deckId
        ? (target: string, alias?: string) => (
            <CardRefLink
              deckId={deckId}
              prefix={prefix}
              displayId={target}
              alias={alias}
            />
          )
        : undefined,
    }),
    [cardId, deckId, prefix]
  )

  return (
    <MarkdownRenderersProvider value={renderers}>
      {children}
    </MarkdownRenderersProvider>
  )
}
