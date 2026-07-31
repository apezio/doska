import type { Card } from "@doska/core/types"
import { useState } from "react"
import { ScrollView, TextInput, View } from "react-native"
import { useKeyboardHeight } from "@/lib/use-keyboard-height"
import { useTokens } from "@/lib/tokens"
import { CardBody } from "./card-body"
import { CardPaneHeader } from "./card-pane-header"
import { SlashMenu } from "./slash-menu"
import { useSlashMenu } from "./use-slash-menu"

/** Backs the inputs only: round-tripping each keystroke would lag the caret. */
export type Draft = Partial<Pick<Card, "title" | "body">>

interface IProps {
  cardId: string
  content: Card
  onQueue: (id: string, patch: Draft) => void
  /** Flushes the queued write and leaves the card. */
  onClose: () => void
}

/** One card's editing session. Mount it keyed by `cardId`. */
export function CardPane({ cardId, content, onQueue, onClose }: IProps) {
  const tokens = useTokens()
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

  const titleInput = (
    <TextInput
      multiline
      value={title}
      onChangeText={(value) => edit({ title: value })}
      placeholder="Title"
      placeholderTextColor={tokens.mutedForeground}
      className={
        isPreview
          ? "px-4 py-1.5 text-xl font-sans-semibold text-card-foreground"
          : "px-4 py-1.5 font-mono text-xl text-card-foreground"
      }
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
    <View className="flex-1 bg-card" style={{ paddingBottom: keyboard }}>
      <CardPaneHeader
        cardId={cardId}
        body={body}
        deadline={content.deadline}
        cardNumber={content.number}
        isPreview={isPreview}
        onTogglePreview={() => setPreview(!isPreview)}
        onClose={onClose}
      />

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
