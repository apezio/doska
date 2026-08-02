import { cut, toggleTaskByIndex } from "@doska/markdown/core"
import { TextField } from "@doska/ui-kit-mobile"
import { useMemo } from "react"
import {
  Pressable,
  Text,
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
      <MarkdownView
        onToggleTask={(index) => onChangeBody(toggleTaskByIndex(body, index))}
      >
        {preview}
      </MarkdownView>
    </Pressable>
  )
}
