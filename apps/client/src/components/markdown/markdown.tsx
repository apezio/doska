import { useMemo } from "react"
import { cn } from "@doska/ui-kit"
import {
  parseMarkdown,
  renderMarkdown,
  useMarkdownRenderers,
} from "@doska/markdown"
import { createWebAdapter } from "./web-adapter"
import "@doska/tokens/markdown.css"

interface IProps {
  children: string
  className?: string
  /**
   * When provided, task-list checkboxes become interactive; clicking one calls
   * back with its 0-based index in document order (matching `taskProgress` /
   * `toggleTaskByIndex`). Without it, checkboxes render read-only.
   */
  onToggleTask?: (index: number) => void
}

export function Markdown({ children, className, onToggleTask }: IProps) {
  // Attachment images and wikilinks need app data to resolve; see `renderers`.
  const renderers = useMarkdownRenderers()

  const content = useMemo(() => {
    const adapter = createWebAdapter(renderers)
    return renderMarkdown(parseMarkdown(children), adapter, { onToggleTask })
  }, [children, renderers, onToggleTask])

  return <div className={cn("markdown", className)}>{content}</div>
}
