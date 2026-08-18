import {
  parseMarkdown,
  renderMarkdown,
  useMarkdownRenderers,
} from "@doska/markdown"
import { useMemo, type ReactNode } from "react"
import { View } from "react-native"
import { createNativeAdapter } from "./native-adapter"

interface IProps {
  children: string
  /**
   * When provided, task-list checkboxes become interactive; tapping one calls
   * back with its 0-based index in document order (matching `taskProgress` /
   * `toggleTaskByIndex`). Without it they render read-only.
   */
  onToggleTask?: (index: number) => void
}

/**
 * Renders a card body natively, over the same mdast the web renderer uses. The
 * caller applies any markers first — this draws whatever markdown it is given.
 */
export function MarkdownView({ children, onToggleTask }: IProps) {
  const renderers = useMarkdownRenderers()

  const tree = useMemo(() => parseMarkdown(children), [children])

  const content: ReactNode[] = useMemo(
    () =>
      renderMarkdown(tree, createNativeAdapter(renderers), { onToggleTask }),
    [tree, renderers, onToggleTask]
  )

  return <View className="gap-2">{content}</View>
}
