import { useState } from "react"
import { CardEditor } from "./card-editor"
import { useCardHistory } from "./use-card-history"
import type { EditSource } from "./text-history"
import type { Card } from "@doska/core/types"

/** Backs the textareas only: round-tripping each keystroke would lag the caret. */
export type Draft = Partial<Pick<Card, "title" | "body">>

interface IProps {
  cardId: string
  content: Card
  onQueue: (id: string, patch: Draft) => void
  onClose: () => void
  onDelete: () => void
  onReveal: () => void
}

/** One card's editing session. Mount it keyed by `cardId`. */
export function CardPane({
  cardId,
  content,
  onQueue,
  onClose,
  onDelete,
  onReveal,
}: IProps) {
  const [draft, setDraft] = useState<Draft>({})
  const [isPreview, setPreview] = useState(() => Boolean(content.body.trim()))

  // Untouched fields still follow the card, so these are what is on screen.
  const title = draft.title ?? content.title
  const body = draft.body ?? content.body

  const history = useCardHistory({
    state: { title, body },
    onRestore: (patch) => {
      setDraft((d) => ({ ...d, ...patch }))
      // A step always changes something, but never queue an empty write on the
      // strength of that.
      if (patch.title !== undefined || patch.body !== undefined)
        onQueue(cardId, patch)
    },
  })

  const edit = (patch: Draft, source: EditSource) => {
    history.record({ title, body, ...patch }, source)
    setDraft((d) => ({ ...d, ...patch }))
    onQueue(cardId, patch)
  }

  return (
    <CardEditor
      cardId={cardId}
      title={title}
      body={body}
      isPreview={isPreview}
      titleProps={history.fieldProps("title")}
      bodyProps={history.fieldProps("body")}
      history={{
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        onUndo: history.undo,
        onRedo: history.redo,
      }}
      onChangeTitle={(title) => edit({ title }, "typing")}
      onChangeBody={(body, source) => edit({ body }, source)}
      onTogglePreview={() => {
        // Switching how the card is shown ends the run of typing behind it.
        history.breakGroup()
        setPreview(!isPreview)
      }}
      onEdit={() => setPreview(false)}
      onClose={onClose}
      onDelete={onDelete}
      onReveal={onReveal}
    />
  )
}
