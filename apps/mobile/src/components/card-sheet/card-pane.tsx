import type { Card } from "@doska/core/types"
import { taskProgress } from "@doska/markdown/core"
import { useState } from "react"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { useKeyboardHeight } from "@/lib/use-keyboard-height"
import { CardBody } from "./card-body"
import { SlashMenu } from "./slash-menu"
import { useSlashMenu } from "./use-slash-menu"

/** Backs the inputs only: round-tripping each keystroke would lag the caret. */
export type Draft = Partial<Pick<Card, "title" | "body">>

interface IProps {
  cardId: string
  content: Card
  onQueue: (id: string, patch: Draft) => void
}

/** One card's editing session. Mount it keyed by `cardId`. */
export function CardPane({ cardId, content, onQueue }: IProps) {
  const [draft, setDraft] = useState<Draft>({})
  // Decided at mount, never re-derived: once you type, `content.body` is no
  // longer evidence the card opened with notes.
  const [isPreview, setPreview] = useState(() => Boolean(content.body.trim()))

  const title = draft.title ?? content.title
  const body = draft.body ?? content.body

  const edit = (patch: Draft) => {
    setDraft((d) => ({ ...d, ...patch }))
    onQueue(cardId, patch)
  }

  const slash = useSlashMenu({
    value: body,
    onChangeValue: (value) => edit({ body: value }),
  })
  // Whether the `/` button is showing the full list; a typed trigger overrides it.
  const [isListOpen, setListOpen] = useState(false)
  const keyboard = useKeyboardHeight()

  const tasks = taskProgress(body)

  const titleInput = (
    <TextInput
      multiline
      value={title}
      onChangeText={(value) => edit({ title: value })}
      placeholder="Title"
      placeholderTextColor="#a3a3a3"
      className="px-4 pb-1 pt-3 text-xl font-semibold text-neutral-900 dark:text-neutral-100"
    />
  )

  const bodyView = (
    <CardBody
      body={body}
      isPreview={isPreview}
      onChangeBody={(value) => edit({ body: value })}
      onEdit={() => setPreview(false)}
      onSelectionChange={slash.onSelectionChange}
      selection={slash.selection}
    />
  )

  return (
    <View
      className="flex-1 bg-white dark:bg-neutral-950"
      style={{ paddingBottom: keyboard }}
    >
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        {tasks.total > 0 ? (
          <Text className="text-[13px] text-neutral-500 dark:text-neutral-400">
            {tasks.done}/{tasks.total}
          </Text>
        ) : (
          <View />
        )}
        <Pressable onPress={() => setPreview(!isPreview)} hitSlop={8}>
          <Text className="text-base text-blue-600">
            {isPreview ? "Edit" : "Preview"}
          </Text>
        </Pressable>
      </View>

      {/* The editor scrolls itself, so it cannot sit in a ScrollView: a nested
          multiline TextInput never follows its own caret. Only the preview,
          which has no caret to follow, gets an outer scroller. */}
      {isPreview ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-10"
        >
          {titleInput}
          {bodyView}
        </ScrollView>
      ) : (
        <>
          {titleInput}
          {bodyView}
        </>
      )}

      {!isPreview && (
        <SlashMenu
          items={
            slash.hasTrigger
              ? slash.items
              : isListOpen
                ? slash.commands
                : []
          }
          isOpen={isListOpen}
          onToggle={() => setListOpen(!isListOpen)}
          onSelect={(command) => {
            if (slash.hasTrigger) slash.select(command)
            else slash.insertCommand(command)
          }}
        />
      )}
    </View>
  )
}
