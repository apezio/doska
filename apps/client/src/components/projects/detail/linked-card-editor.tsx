import { useEffect, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { DEFAULT_SLASH_COMMANDS } from "@doska/markdown"
import { useCardRefOptions } from "@doska/core/card-refs"
import { keys } from "@doska/core/keys"
import { useSaveCard } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import type { Card } from "@doska/core/types"
import { Button, Input, Markdown, shortcutLabel } from "@doska/ui-kit"
import { imageSlashCommands } from "../../card/attachments/image-slash-commands"
import { MarkdownTextarea } from "../../markdown"
import { notifyWriteError } from "../shared/notify"
import { useProjectCtx } from "./project-context"

export interface CardDraft {
  title: string
  body: string
}

interface IProps {
  cardId: string
  boardId: string
  /** Null until edited. The row holds it, so it outlives a collapse. */
  draft: CardDraft | null
  onDraft: (draft: CardDraft | null) => void
}

/** A linked card's title and body, editable in place and saved on demand. */
export function LinkedCardEditor({ cardId, boardId, draft, onDraft }: IProps) {
  const { projectId } = useProjectCtx()
  const qc = useQueryClient()
  const { data: card, isPending } = useCard(cardId)
  const { mutateAsync: save, isPending: saving } = useSaveCard()
  const cardRefs = useCardRefOptions(boardId, cardId)
  const attachments = card?.attachments

  const slashCommands = useMemo(
    () => [...DEFAULT_SLASH_COMMANDS, ...imageSlashCommands(attachments ?? [])],
    [attachments]
  )

  // Only the open board syncs, so the copy here can be behind what an agent
  // wrote since; saving it as-is would put the old text back.
  useEffect(() => {
    void sync.reconcileBoards([boardId])
  }, [boardId])

  if (isPending)
    return <p className="text-sm text-muted-foreground">Loading…</p>
  // `getCard` answers a card this device never pulled with a placeholder.
  if (!card || card.id !== cardId || card.deletedAt !== null)
    return (
      <p className="text-sm text-muted-foreground">
        This card isn't on this device yet. Open it on its board.
      </p>
    )

  const value = draft ?? { title: card.title, body: card.body }
  const dirty = value.title !== card.title || value.body !== card.body
  const edit = (fields: Partial<CardDraft>) => onDraft({ ...value, ...fields })

  const submit = async () => {
    if (!dirty || saving) return
    try {
      await save({ id: cardId, patch: value })
    } catch (err) {
      return notifyWriteError(err as Error)
    }
    // Without this the old text flashes back until the refetch lands.
    qc.setQueryData<Card>(keys.card(cardId), (c) => c && { ...c, ...value })
    onDraft(null)
    // The row's title is the server's copy: push the edit before refetching it.
    await sync.reconcile()
    void qc.invalidateQueries({ queryKey: keys.project(projectId) })
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation()
          onDraft(null)
        }
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          void submit()
        }
      }}
    >
      <Input
        aria-label="Card title"
        placeholder="Title"
        value={value.title}
        onChange={(e) => edit({ title: e.target.value })}
      />
      {/* The border sits outside the editor: its highlight layer is laid over
          the textarea edge to edge, so padding inside would misalign them. */}
      <div className="rounded-lg border border-input px-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        <MarkdownTextarea
          aria-label="Card body"
          renderPreview={Markdown}
          value={value.body}
          onChange={(e) => edit({ body: e.target.value })}
          onChangeValue={(body) => edit({ body })}
          slashMenu
          highlight
          slashCommands={slashCommands}
          wikilinks={cardRefs}
          placeholder="Notes"
          className="min-h-28 md:text-sm"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Button type="submit" size="sm" disabled={!dirty || saving}>
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!dirty}
          onClick={() => onDraft(null)}
        >
          Cancel
        </Button>
        <span className="ml-auto text-xs text-muted-foreground max-md:hidden">
          Markdown, {shortcutLabel("Enter")} to save
        </span>
      </div>
    </form>
  )
}
