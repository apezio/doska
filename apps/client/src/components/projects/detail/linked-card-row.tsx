import type { LinkedCard } from "@doska/contract"
import { cardDisplayId } from "@doska/contract"
import { CircleCheck, Lock, X } from "lucide-react"
import { Link } from "wouter"
import { Button, cn, Hint } from "@doska/ui-kit"
import { routes } from "@/lib/routes"
import { useProjectWrite } from "../shared/use-project-write"
import { WsChip } from "../shared/ws-chip"
import { useProjectCtx } from "./project-context"

export const LINKED_CARD_MIME = "application/x-doska-linked-card"

export type LinkedCardDrag = Pick<
  LinkedCard,
  "cardId" | "boardId" | "number" | "title" | "workstreamId"
>

interface IProps {
  card: LinkedCard
  /** Name its workstream — off inside that workstream, where it is implied. */
  showWorkstream?: boolean
}

export function LinkedCardRow({ card, showWorkstream }: IProps) {
  const { projectId, workstreamById } = useProjectCtx()
  const { mutate: unlink } = useProjectWrite("cardUnlink", projectId)
  const ws =
    showWorkstream && card.workstreamId
      ? workstreamById.get(card.workstreamId)
      : null
  const id = cardDisplayId(card.number)
  const openable = card.accessible && !card.deleted

  return (
    <li
      draggable={openable}
      onDragStart={(e) => {
        // The link inside is natively draggable even when the row is not.
        if (!openable) return
        const { cardId, boardId, number, title, workstreamId } = card
        const drag: LinkedCardDrag = {
          cardId,
          boardId,
          number,
          title,
          workstreamId,
        }
        e.dataTransfer.setData(LINKED_CARD_MIME, JSON.stringify(drag))
        e.dataTransfer.effectAllowed = "link"
        // Session cards hide their chat iframes from the pointer meanwhile:
        // a cross-origin frame would swallow the drag before the card saw it.
        document.body.dataset.cardDrag = ""
      }}
      onDragEnd={() => delete document.body.dataset.cardDrag}
      className="group/card -mx-1.5 flex min-h-8 items-center gap-1 rounded-md px-1.5 hover:bg-muted/50"
    >
      <Link
        href={`~${routes.deck.to(card.boardId)}${routes.card.to(card.cardId)}`}
        aria-disabled={!openable}
        onClick={(e) => {
          if (!openable) e.preventDefault()
        }}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-sm py-1 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-default"
      >
        {!card.accessible ? (
          <>
            <Lock className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">
              A card you no longer have access to
            </span>
          </>
        ) : (
          <>
            {id && (
              <span className="shrink-0 text-muted-foreground tabular-nums">
                #{id}
              </span>
            )}
            <span
              className={cn(
                "truncate",
                card.deleted && "text-muted-foreground line-through",
                card.done && "text-muted-foreground"
              )}
            >
              {card.title || "Untitled card"}
            </span>
            {card.done && (
              <CircleCheck
                aria-label="Done"
                className="size-3.5 shrink-0 text-primary"
              />
            )}
            {card.deleted && (
              <span className="shrink-0 text-xs text-muted-foreground">
                deleted
              </span>
            )}
          </>
        )}
      </Link>
      {ws && <WsChip name={ws.name} className="max-sm:hidden" />}
      <Hint label="Unlink card">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Unlink card"
          className="size-6 text-muted-foreground md:opacity-0 md:group-hover/card:opacity-100 md:focus-visible:opacity-100"
          onClick={() => unlink({ projectId, cardId: card.cardId })}
        >
          <X className="size-3.5" />
        </Button>
      </Hint>
    </li>
  )
}
