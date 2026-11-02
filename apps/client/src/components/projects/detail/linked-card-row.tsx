import { useId, useState } from "react"
import type { LinkedCard } from "@doska/contract"
import { cardDisplayId } from "@doska/contract"
import { AnimatePresence, motion } from "motion/react"
import { ArrowUpRight, ChevronRight, CircleCheck, Lock, X } from "lucide-react"
import { Link } from "wouter"
import { Button, buttonVariants, cn, Hint } from "@doska/ui-kit"
import { routes } from "@/lib/routes"
import { useProjectWrite } from "../shared/use-project-write"
import { WsChip } from "../shared/ws-chip"
import { endDrag, setDrag } from "./drag"
import { type CardDraft, LinkedCardEditor } from "./linked-card-editor"
import { useProjectCtx } from "./project-context"

const EXPAND = { duration: 0.22, ease: [0.2, 0, 0, 1] } as const

const revealOnHover =
  "size-6 text-muted-foreground md:opacity-0 md:group-hover/card:opacity-100 md:focus-visible:opacity-100"

interface IProps {
  card: LinkedCard
  /** Name its workstream — off inside that workstream, where it is implied. */
  showWorkstream?: boolean
}

export function LinkedCardRow({ card, showWorkstream }: IProps) {
  const { projectId, workstreamById } = useProjectCtx()
  const { mutate: unlink } = useProjectWrite("cardUnlink", projectId)
  const [open, setOpen] = useState(false)
  // Kept here rather than in the panel, so collapsing doesn't lose the edit.
  const [draft, setDraft] = useState<CardDraft | null>(null)
  // The same card can be listed twice on the page: by board and by workstream.
  const panelId = useId()
  const ws =
    showWorkstream && card.workstreamId
      ? workstreamById.get(card.workstreamId)
      : null
  const id = cardDisplayId(card.number)
  const openable = card.accessible && !card.deleted
  const expanded = openable && open
  const toggle = () => setOpen(!open)

  return (
    <li className="-mx-1.5">
      <div
        draggable={openable}
        onDragStart={(e) => {
          // A text selection drags natively even when the row is not.
          if (!openable) return
          const { cardId, boardId, number, title, workstreamId } = card
          setDrag(e, {
            kind: "card",
            cardId,
            boardId,
            number,
            title,
            workstreamId,
          })
        }}
        onDragEnd={endDrag}
        className="group/card flex min-h-8 items-center gap-1 rounded-md px-1.5 hover:bg-muted/50"
      >
        {/* A div rather than a <button>, which some browsers won't drag from. */}
        <div
          role={openable ? "button" : undefined}
          tabIndex={openable ? 0 : undefined}
          aria-expanded={openable ? expanded : undefined}
          aria-controls={openable ? panelId : undefined}
          onClick={openable ? toggle : undefined}
          onKeyDown={(e) => {
            if (!openable || (e.key !== "Enter" && e.key !== " ")) return
            e.preventDefault()
            toggle()
          }}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-sm py-1 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            openable && "cursor-pointer"
          )}
        >
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-90",
              !openable && "invisible"
            )}
          />
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
        </div>
        {ws && <WsChip name={ws.name} className="max-sm:hidden" />}
        {openable && (
          <Hint label="Open on board">
            <Link
              href={`~${routes.deck.to(card.boardId)}${routes.card.to(card.cardId)}`}
              aria-label="Open on board"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                revealOnHover
              )}
            >
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Hint>
        )}
        <Hint label="Unlink card">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Unlink card"
            className={revealOnHover}
            onClick={() => unlink({ projectId, cardId: card.cardId })}
          >
            <X className="size-3.5" />
          </Button>
        </Hint>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            // Unclipped once open, so the `/` and `[[` menus can spill out.
            animate={{
              height: "auto",
              opacity: 1,
              transitionEnd: { overflow: "visible" },
            }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={EXPAND}
            className="overflow-hidden"
          >
            <div className="pt-1 pr-1.5 pb-3 pl-7">
              <LinkedCardEditor
                cardId={card.cardId}
                boardId={card.boardId}
                draft={draft}
                onDraft={setDraft}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
