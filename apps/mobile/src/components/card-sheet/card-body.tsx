import { cut, toggleTaskByIndex } from "@doska/markdown/core"
import { useMemo } from "react"
import {
  Pressable,
  Text,
  TextInput,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native"
import { MarkdownView } from "@/components/markdown/markdown-view"
import { useTokens } from "@/lib/tokens"

interface IProps {
  body: string
  isPreview: boolean
  onChangeBody: (value: string) => void
  /** Fired by tapping the read-only preview. */
  onEdit: () => void
  onSelectionChange: (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => void
  selection?: { start: number; end: number }
}

export function CardBody({
  body,
  isPreview,
  onChangeBody,
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
      <TextInput
        multiline
        autoFocus
        value={body}
        onChangeText={onChangeBody}
        onSelectionChange={onSelectionChange}
        selection={selection}
        placeholder="Notes"
        placeholderTextColor={tokens.mutedForeground}
        textAlignVertical="top"
        // Grows with the note instead of scrolling inside itself, so the title
        // above it scrolls away with the text. `CardPane` owns the scrolling and
        // the caret-following that used to come with it for free.
        scrollEnabled={false}
        className="grow px-4 py-2 font-mono text-[15px] leading-[22px] text-card-foreground"
      />
    )
  }

  if (!body.trim()) {
    return (
      <Pressable onPress={onEdit} className="px-4 py-2">
        <Text className="text-[15px] text-muted-foreground">Notes</Text>
      </Pressable>
    )
  }

  return (
    <Pressable onPress={onEdit} className="px-4 py-2">
      <MarkdownView
        onToggleTask={(index) => onChangeBody(toggleTaskByIndex(body, index))}
      >
        {preview}
      </MarkdownView>
    </Pressable>
  )
}
