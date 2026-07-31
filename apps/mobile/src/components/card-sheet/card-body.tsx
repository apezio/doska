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
        placeholderTextColor="#a3a3a3"
        textAlignVertical="top"
        // Fills the pane and scrolls internally, which is what keeps the caret
        // above the keyboard as the note grows.
        className="flex-1 px-4 py-2 font-mono text-[15px] leading-[22px] text-neutral-900 dark:text-neutral-100"
      />
    )
  }

  if (!body.trim()) {
    return (
      <Pressable onPress={onEdit} className="px-4 py-2">
        <Text className="text-[15px] text-neutral-400">Notes</Text>
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
