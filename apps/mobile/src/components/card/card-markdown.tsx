import { MarkdownRenderersProvider } from "@doska/markdown"
import { useMemo, type ReactNode } from "react"
import { CardRefLink } from "./refs/card-ref-link"

interface IProps {
  /** The board the references resolve against — `[[ROAD-12]]` names a card on
   * the same board, so this is as wide as a reference can reach. */
  deckId: string
  prefix: string
  children: ReactNode
}

/**
 * Resolves the parts of a card body that need app data. Only `[[ROAD-12]]` card
 * refs so far: attachment images have no mobile storage adapter yet, so an
 * `attachment:` ref falls through to plain markdown.
 */
export function CardMarkdown({ deckId, prefix, children }: IProps) {
  const renderers = useMemo(
    () => ({
      renderWikilink: (target: string, alias?: string) => (
        <CardRefLink
          deckId={deckId}
          prefix={prefix}
          displayId={target}
          alias={alias}
        />
      ),
    }),
    [deckId, prefix]
  )

  // Until the card's board has resolved there is nothing to resolve refs
  // against, and they render as the plain text they already are.
  if (!deckId) return children

  return (
    <MarkdownRenderersProvider value={renderers}>
      {children}
    </MarkdownRenderersProvider>
  )
}
