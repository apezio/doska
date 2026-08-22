import {
  DEFAULT_SLASH_COMMANDS,
  type SlashCommand,
  type WikilinkOption,
} from "@doska/markdown"
import type { Card } from "@doska/core/types"
import { useCardRefOptions } from "@doska/core/card-refs"
import { useCardDeckId } from "@doska/core/queries"
import { cn, TextField } from "@doska/ui-kit-mobile"
import { useEffect, useMemo, useRef, useState } from "react"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useKeyboardHeight } from "@/lib/use-keyboard-height"
import { CardAttachments } from "@/components/card/attachments/card-attachments"
import { imageSlashCommands } from "@/components/card/attachments/image-slash-commands"
import { useAttachmentUpload } from "@/components/card/attachments/use-attachment-upload"
import { CardBody } from "./card-body"
import { CardPaneHeader } from "./card-pane-header"
import { EditorToolbar, TOOLBAR_HEIGHT } from "./editor-toolbar"
import { useListContinuation } from "./use-list-continuation"
import { useSlashMenu } from "./use-slash-menu"

const NO_REFS: WikilinkOption[] = []

/** Backs the inputs only: round-tripping each keystroke would lag the caret. */
export type Draft = Partial<Pick<Card, "title" | "body">>

interface IProps {
  cardId: string
  content: Card
  onQueue: (id: string, patch: Draft) => void
}

/** One card's editing session. Mount it keyed by `cardId`. */
export function CardPane({ cardId, content, onQueue }: IProps) {
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const { data: deckId } = useCardDeckId(cardId)

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

  const cardRefs = useCardRefOptions(deckId ?? "", cardId)
  const refTargets = useMemo(
    () => cardRefs.map((option) => option.target),
    [cardRefs]
  )

  const uploads = useAttachmentUpload(cardId)

  const commands = useMemo(
    () => [
      ...DEFAULT_SLASH_COMMANDS,
      ...imageSlashCommands(content.attachments),
    ],
    [content.attachments]
  )

  const slash = useSlashMenu({
    value: body,
    onChangeValue: (value) => edit({ body: value }),
    commands,
    cardRefs,
  })

  const onChangeText = useListContinuation({
    value: body,
    caret: slash.caret,
    onChangeValue: (value) => edit({ body: value }),
    moveCaret: slash.moveCaret,
  })

  const scroller = useRef<ScrollView>(null)
  // Only the caret at the very end can be pushed out of view by something other
  // than the user: the note growing under it, or the keyboard rising over it.
  // Anywhere else the caret keeps its place on screen, and chasing it there
  // would yank the note out from under someone deleting a line mid-body.
  const isAtEnd = slash.caret >= body.length

  // The keyboard does not change the content height, so `onContentSizeChange`
  // never fires for it — but it does change how much of the note is visible.
  useEffect(() => {
    if (isAtEnd && keyboard) scroller.current?.scrollToEnd({ animated: true })
  }, [isAtEnd, keyboard])

  const toolbar = {
    // The full list stands open while editing, so a typed `/` only narrows it.
    // Inserting needs somewhere to insert into, and a typed `/` survives into
    // preview, where the caret it was measured against is gone.
    items: isPreview ? [] : slash.hasTrigger ? slash.items : slash.commands,
    refs: isPreview ? NO_REFS : slash.refs,
    isPreview,
    canAttach: uploads.enabled,
    attaching: uploads.busy,
    onAttach: () => void uploads.attach("files"),
    onAttachPhoto: () => void uploads.attach("photos"),
    onTogglePreview: () => setPreview(!isPreview),
    onSelect: (command: SlashCommand) => {
      if (slash.hasTrigger) slash.select(command)
      else slash.insertCommand(command)
    },
    onSelectRef: slash.selectRef,
  }

  // Everything the bar covers: its own height, a gap, and the keyboard or the
  // home indicator underneath it. The pane itself carries no padding — an
  // absolute child is laid out against the border box, so padding here would
  // fail to lift the bar.
  const bottomInset = keyboard || insets.bottom

  return (
    <View collapsable={false} className="flex-1 bg-card">
      <ScrollView
        ref={scroller}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: TOOLBAR_HEIGHT + 16 + bottomInset,
        }}
        onContentSizeChange={() => {
          if (isAtEnd) scroller.current?.scrollToEnd({ animated: false })
        }}
      >
        <CardPaneHeader
          cardId={cardId}
          body={body}
          deadline={content.deadline}
          priority={content.priority}
        />
        <CardAttachments
          cardId={cardId}
          isReadonly={isPreview}
          pending={uploads.pending}
          uploadError={uploads.error}
          className="px-4 pt-2"
        />
        <TextField
          multiline
          value={title}
          onChangeText={(value) => edit({ title: value })}
          placeholder="Title"
          className={cn(
            "mb-2 mt-4 font-sans-bold px-4 py-1.5 text-2xl text-card-foreground",
            !isPreview && "font-mono-medium"
          )}
        />
        <CardBody
          cardId={cardId}
          body={body}
          deckId={deckId ?? ""}
          refTargets={refTargets}
          isPreview={isPreview}
          onChangeBody={(value) => edit({ body: value })}
          onChangeText={onChangeText}
          onEdit={() => setPreview(false)}
          onSelectionChange={slash.onSelectionChange}
          selection={slash.selection}
        />
      </ScrollView>

      {/* Floats over the note, so the blur has something to blur.
          `InputAccessoryView` would be the native way to ride the keyboard, but
          it does not render inside a `formSheet` — the bar simply vanished
          whenever the keyboard opened. */}
      <View className="absolute inset-x-0" style={{ bottom: bottomInset }}>
        <EditorToolbar {...toolbar} />
      </View>
    </View>
  )
}
