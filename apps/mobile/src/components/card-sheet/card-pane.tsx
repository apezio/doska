import type { SlashCommand } from "@doska/markdown/core"
import type { Card } from "@doska/core/types"
import { Stack } from "expo-router"
import { useRef, useState } from "react"
import { ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useKeyboardHeight } from "@/lib/use-keyboard-height"
import { useTokens } from "@/lib/tokens"
import { CardBody } from "./card-body"
import { CardPaneHeader } from "./card-pane-header"
import { EditorToolbar, TOOLBAR_HEIGHT } from "./editor-toolbar"
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
  const tokens = useTokens()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const scroller = useRef<ScrollView>(null)

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

  // Typing at the end of the note has to keep the caret in view, and nothing
  // else may move the scroller — deleting a line mid-note also changes the
  // content height, and following that would throw the reader to the bottom.
  const isAtEnd = slash.caret >= body.length

  const toolbar = {
    // The full list stands open while editing, so a typed `/` only narrows it.
    // Inserting needs somewhere to insert into, and a typed `/` survives into
    // preview, where the caret it was measured against is gone.
    items: isPreview ? [] : slash.hasTrigger ? slash.items : slash.commands,
    isPreview,
    onTogglePreview: () => setPreview(!isPreview),
    onSelect: (command: SlashCommand) => {
      if (slash.hasTrigger) slash.select(command)
      else slash.insertCommand(command)
    },
  }

  return (
    <View
      className="flex-1 bg-card"
      style={{ paddingBottom: keyboard || insets.bottom }}
    >
      {/* The meta rides the sheet's own header bar rather than a row of its
          own: inside the sheet's content it drew on top of the title. */}
      <Stack.Screen
        options={{
          headerTitleAlign: "left",
          headerTitle: () => (
            <CardPaneHeader
              cardId={cardId}
              body={body}
              deadline={content.deadline}
              cardNumber={content.number}
            />
          ),
        }}
      />

      {/* The bar overlays this rather than the pane, so it is positioned inside
          the space the keyboard leaves rather than against the padding that
          creates it — absolute children are laid out against the border box. */}
      <View className="flex-1">
        {/* One scroller over both, so the title scrolls away with the note
            rather than staying pinned above it. */}
        <ScrollView
          ref={scroller}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          // The bar takes no layout space, so `scrollToEnd` would otherwise
          // stop with the caret's line underneath it.
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: TOOLBAR_HEIGHT + 16,
          }}
          onContentSizeChange={() => {
            if (!isPreview && isAtEnd) {
              scroller.current?.scrollToEnd({ animated: false })
            }
          }}
        >
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
          <CardBody
            body={body}
            isPreview={isPreview}
            onChangeBody={(value) => edit({ body: value })}
            onEdit={() => setPreview(false)}
            onSelectionChange={slash.onSelectionChange}
            selection={slash.selection}
          />
        </ScrollView>

        {/* Floats over the note, so the blur has something to blur.
            `InputAccessoryView` would be the native way to ride the keyboard,
            but it does not render inside a `formSheet` — the bar simply
            vanished whenever the keyboard opened. */}
        <View className="absolute inset-x-0 bottom-0">
          <EditorToolbar {...toolbar} />
        </View>
      </View>
    </View>
  )
}
