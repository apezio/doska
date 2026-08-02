import {
  parseMarkdown,
  renderMarkdown,
  useMarkdownRenderers,
} from "@doska/markdown"
import { useMemo, type ReactNode } from "react"
import { useColorScheme, View } from "react-native"
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
  // Only the tag palette needs the scheme as a value; everything else themes
  // itself through the `dark:` variants NativeWind resolves.
  const dark = useColorScheme() === "dark"
  const renderers = useMarkdownRenderers()

  const content: ReactNode[] = useMemo(() => {
    const adapter = createNativeAdapter(renderers, dark)
    return renderMarkdown(parseMarkdown(children), adapter, { onToggleTask })
  }, [children, dark, renderers, onToggleTask])

  return <View className="gap-2">{content}</View>
}
