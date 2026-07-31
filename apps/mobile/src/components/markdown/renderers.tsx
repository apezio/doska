import { createContext, useContext, type ReactNode } from "react"

/**
 * The native counterpart of the web package's `MarkdownRenderers`: the parts of
 * a body only the host app can resolve. Kept local because the web version
 * ships from `@doska/markdown`'s root entry, which pulls in `react-markdown`.
 */
export interface MarkdownRenderers {
  /** Renders an `attachment:<key>` image ref. */
  renderImage?: (attachmentKey: string, alt: string) => ReactNode
  /** Renders a `[[target]]` wikilink. */
  renderWikilink?: (target: string) => ReactNode
}

const NONE: MarkdownRenderers = {}

const MarkdownRenderersContext = createContext<MarkdownRenderers>(NONE)

export const MarkdownRenderersProvider = MarkdownRenderersContext.Provider

export function useMarkdownRenderers() {
  return useContext(MarkdownRenderersContext)
}
