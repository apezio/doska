import { cut, toggleTaskByIndex } from "@doska/markdown"
import { TextField } from "@doska/ui-kit-mobile"
import { useMemo } from "react"
import {
  Pressable,
  Text,
  type TextInputSelectionChangeEvent,
} from "react-native"
import { CardMarkdown } from "@/components/card/card-markdown"
import { MarkdownView } from "@/components/markdown/markdown-view"

interface IProps {
  body: string
  /** The card's board, for the `[[ROAD-12]]` refs in its body. */
  deckId: string
  prefix: string
  isPreview: boolean
  onChangeBody: (value: string) => void
  /** Fired by tapping the read-only preview. */
  onEdit: () => void
  onSelectionChange: (e: TextInputSelectionChangeEvent) => void
  selection?: { start: number; end: number }
}

export function CardBody({
  body,
  deckId,
  prefix,
  isPreview,
  onChangeBody,
  onEdit,
  onSelectionChange,
  selection,
}: IProps) {
  // The cut marker stays visible here as a divider rather than truncating, the
  // way it does on a board card.
  const preview = useMemo(() => cut.previewRender(body).body, [body])

  if (!isPreview) {
    return (
      <TextField
        multiline
        autoFocus
        value={body}
        onChangeText={onChangeBody}
        onSelectionChange={onSelectionChange}
        selection={selection}
        placeholder="Notes"
        textAlignVertical="top"
        scrollEnabled={false}
        className="grow px-4 py-2 font-mono text-[15px] leading-[22px] text-card-foreground"
      />
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
      <CardMarkdown deckId={deckId} prefix={prefix}>
        <MarkdownView
          onToggleTask={(index) => onChangeBody(toggleTaskByIndex(body, index))}
        >
          {preview}
        </MarkdownView>
      </CardMarkdown>
    </Pressable>
  )
}
