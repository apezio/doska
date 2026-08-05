import { useMemo } from "react"
import {
  parseMarkdown,
  renderMarkdown,
  useMarkdownRenderers,
} from "@doska/markdown"
import { createWebAdapter } from "./adapter"
import { MarkdownRoot } from "./markdown-root"

interface IProps {
  children: string
  className?: string
  onToggleTask?: (index: number) => void
}

export function Markdown({ children, className, onToggleTask }: IProps) {
  // Attachment images and wikilinks need app data to resolve; see `renderers`.
  const renderers = useMarkdownRenderers()

  const content = useMemo(() => {
    const adapter = createWebAdapter(renderers)
    return renderMarkdown(parseMarkdown(children), adapter, { onToggleTask })
  }, [children, renderers, onToggleTask])

  return <MarkdownRoot className={className}>{content}</MarkdownRoot>
}
