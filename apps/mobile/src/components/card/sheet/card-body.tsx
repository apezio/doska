import { cut, toggleTaskByIndex } from "@doska/markdown"
import { Text, TextField } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { useMemo } from "react"
import {
  Pressable,
  View,
  type TextInputSelectionChangeEvent,
} from "react-native"
import { CardMarkdown } from "@/components/card/card-markdown"
import { HighlightOverlay } from "@/components/markdown/highlight/highlight-overlay"
import { MarkdownView } from "@/components/markdown/markdown-view"

// Both layers of the editor wear this: it is what keeps the painted text under
// the caret. The input adds only its transparent color on top.
const EDITOR_TEXT = "px-4 py-2 font-mono text-[15px] leading-[22px]"

interface IProps {
  cardId: string
  body: string
  /** The card's board, for the `[[ROAD-12]]` refs in its body. */
  deckId: string
  prefix: string
  /** Refs that resolve, so the overlay can grey out the ones that do not. */
  refTargets: string[]
  isPreview: boolean
  onChangeBody: (value: string) => void
  /** Typing, which unlike `onChangeBody` continues Markdown lists on newline. */
  onChangeText: (value: string) => void
  /** Fired by tapping the read-only preview. */
  onEdit: () => void
  onSelectionChange: (e: TextInputSelectionChangeEvent) => void
  selection?: { start: number; end: number }
}

export function CardBody({
  cardId,
  body,
  deckId,
  prefix,
  refTargets,
  isPreview,
  onChangeBody,
  onChangeText,
  onEdit,
  onSelectionChange,
  selection,
}: IProps) {
  const tokens = useTokens()
  // The cut marker stays visible here as a divider rather than truncating, the
  // way it does on a board card.
  const preview = useMemo(() => cut.previewRender(body).body, [body])

  if (!isPreview) {
    return (
      <View className="grow">
        <HighlightOverlay
          value={body}
          targets={refTargets}
          className={`absolute inset-x-0 top-0 ${EDITOR_TEXT} text-card-foreground`}
        />
        <TextField
          multiline
          autoFocus
          value={body}
          onChangeText={onChangeText}
          onSelectionChange={onSelectionChange}
          selection={selection}
          placeholder="Notes"
          textAlignVertical="top"
          scrollEnabled={false}
          selectionColor={tokens.cardForeground}
          className={`grow ${EDITOR_TEXT} text-transparent`}
        />
      </View>
    )
  }

  if (!body.trim()) {
    return (
      <Pressable onPress={onEdit} className="grow px-4 py-2">
        <Text className="text-[15px] text-muted-foreground">Notes</Text>
      </Pressable>
    )
  }

  return (
    <Pressable onPress={onEdit} className="grow px-4 py-2">
      <CardMarkdown cardId={cardId} deckId={deckId} prefix={prefix}>
        <MarkdownView
          onToggleTask={(index) => onChangeBody(toggleTaskByIndex(body, index))}
        >
          {preview}
        </MarkdownView>
      </CardMarkdown>
    </Pressable>
  )
}
